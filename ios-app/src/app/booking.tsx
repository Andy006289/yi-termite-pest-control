/* Book a service.
   - Days and arrival windows come from timeslots.xml; each window shows the places left
     after existing demand and bookings already made in the app.
   - ?date=&window= (from the result screen) pre-selects a window.
   - The form is validated on the phone (required fields, Australian mobile, optional
     email, pricing acknowledgement) before anything is saved.
   - A valid booking is written as a <booking> XML element (store.saveBooking).
   Mobile additions: horizontal date strip, iOS autofill content types, keyboard types
   per field, "use my saved details", haptic feedback, scroll to the first error. */

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Checkbox, Divider, Eyebrow, Field, FieldError, H3, Loading, Muted, Notice, PestVisual, Pill, Row, Small, Timeline, tapFeedback } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { formatDay, parseISODate, range, weekdayShort } from '@/lib/format';
import { buildDays, windowLabel } from '@/lib/schedule';
import { saveBooking } from '@/lib/store';
import { colors, fonts, radius, space } from '@/lib/theme';
import { normaliseMobile, validateBooking, type BookingErrors, type BookingForm } from '@/lib/validation';

const ACCESS = ["I'll be home", 'Key with agent / neighbour', "Lockbox — I'll share the code"];

export default function Booking() {
  const { data, estimate, bookings, refreshBookings } = useAppData();
  const params = useLocalSearchParams<{ date?: string; window?: string }>();
  const scroll = useRef<ScrollView>(null);
  const [positions] = useState<Record<string, number>>(() => ({})); // section offsets, for scrolling to the first error

  const days = useMemo(() => {
    if (!data) return [];
    const used = bookings.filter((b) => b.source === 'app').map((b) => ({ date: b.date, window: b.window, status: b.status }));
    return buildDays(data.schedule, used);
  }, [data, bookings]);

  // default: the day/window from the result screen if still free, else the first open day
  const initialDay = days.find((d) => d.date === params.date && d.open) ?? days.find((d) => d.open);
  const initialWin = initialDay?.windows.some((w) => w.id === params.window && w.remaining > 0) ? params.window! : null;
  const [pickedDate, setDate] = useState<string | null>(null);
  const [pickedWin, setWin] = useState<string | null | undefined>(undefined);
  const date = pickedDate ?? initialDay?.date ?? null;
  const win = pickedWin !== undefined ? pickedWin : pickedDate ? null : initialWin;
  const [pestChoice, setPestChoice] = useState<string>(estimate?.answers.pest ?? 'cockroach');
  const [form, setForm] = useState<BookingForm>({
    firstName: '', lastName: '', mobile: '', email: '', address: '', access: ACCESS[0], notes: estimate?.answers.notes ?? '', agree: false,
  });
  const [pets, setPets] = useState(estimate?.answers.pets ? 'yes' : 'no');
  const [sms, setSms] = useState(true);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!data) return <Loading />;
  const { pests, pricing, schedule, account } = data;

  // with no estimate: a standard visit for the chosen pest, priced from its base range
  const est = estimate ?? (() => {
    const base = pricing.bases[pestChoice];
    return { answers: { pest: pestChoice, property: 'house', size: '3', area: 'both' }, label: base.label, min: base.min, max: base.max, labels: null as null, ref: '' };
  })();
  const day = days.find((d) => d.date === date);

  const update = (patch: Partial<BookingForm>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (attempted) setErrors(validateBooking(next, win));
  };

  const useSaved = () => {
    const c = account.customer;
    update({ firstName: c.firstName, lastName: c.lastName, mobile: c.mobile, email: c.email, address: c.address });
  };

  const submit = async () => {
    setAttempted(true);
    const errs = validateBooking(form, win);
    setErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length) {
      tapFeedback('warn');
      const order = ['window', 'firstName', 'lastName', 'mobile', 'email', 'address', 'agree'];
      const firstBad = order.find((k) => keys.includes(k))!;
      scroll.current?.scrollTo({ y: Math.max(0, (positions[firstBad] ?? 0) - 20), animated: true });
      return;
    }
    setSaving(true);
    try {
      const ref = await saveBooking({
        pest: est.answers.pest,
        date: date!,
        window: win!,
        property: { type: est.answers.property, size: est.answers.size, area: est.answers.area, address: form.address.trim() },
        estimate: { min: est.min, max: est.max },
        contact: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), mobile: normaliseMobile(form.mobile)!, email: form.email.trim() },
        access: form.access,
        notes: [pets === 'yes' ? 'Pets or children at home.' : '', form.notes.trim()].filter(Boolean).join(' '),
      }, data.sampleDoc);
      await refreshBookings();
      tapFeedback('success');
      router.replace({ pathname: '/confirmed/[ref]', params: { ref } });
    } catch (e) {
      setErrors({ window: (e as Error).message });
      setSaving(false);
    }
  };

  const count = Object.keys(errors).length;
  const mark = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => { positions[key] = e.nativeEvent.layout.y; };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space[4], gap: space[4], paddingBottom: space[7] }}>
        {/* summary */}
        <Card>
          <Eyebrow>Booking summary</Eyebrow>
          <Row>
            <PestVisual id={est.answers.pest} size={56} />
            <View style={{ flex: 1 }}>
              <H3>{est.label}</H3>
              <Muted>{est.labels ? `${est.labels.size} ${est.labels.property.toLowerCase()} · ${est.labels.area.toLowerCase()}` : 'Standard visit'}</Muted>
            </View>
            <Text style={{ fontFamily: fonts.head, fontSize: 16, color: colors.green900 }}>{range(est.min, est.max)}</Text>
          </Row>
          {!estimate ? (
            <>
              <Notice>You haven’t got an estimate yet, so we’ll book a standard visit. Get an estimate first for an accurate price range.</Notice>
              <Small style={{ fontFamily: fonts.bodySemi }}>What do you need help with?</Small>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
                {pests.map((p) => <Pill key={p.id} label={p.name} selected={pestChoice === p.id} onPress={() => setPestChoice(p.id)} />)}
              </ScrollView>
            </>
          ) : null}
        </Card>

        {/* 1 · day */}
        <View style={{ gap: space[3] }}>
          <H3>1 · Choose a day</H3>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
            {days.map((d) => {
              const on = d.date === date;
              return (
                <Pressable key={d.date} disabled={!d.open}
                  accessibilityRole="radio" accessibilityState={{ selected: on, disabled: !d.open }} accessibilityLabel={`${formatDay(d.date)}${d.open ? '' : ', unavailable'}`}
                  onPress={() => { tapFeedback('select'); setDate(d.date); setWin(null); }}
                  style={{ width: 60, height: 72, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2,
                    borderColor: on ? colors.green700 : colors.line, backgroundColor: on ? colors.green700 : d.open ? colors.surface : '#EEF1EF', opacity: d.open ? 1 : 0.55 }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: on ? colors.green100 : colors.ink3 }}>{weekdayShort(d.date)}</Text>
                  <Text style={{ fontFamily: fonts.headBold, fontSize: 20, color: on ? '#fff' : colors.green900, textDecorationLine: d.open ? 'none' : 'line-through' }}>{parseISODate(d.date).getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2 · window */}
        <View style={{ gap: space[3] }} onLayout={mark('window')}>
          <H3>2 · Arrival window</H3>
          {day ? (
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {day.windows.map((w) => {
                const on = w.id === win;
                const off = w.remaining === 0;
                const badge = off ? 'Full' : w.remaining === 1 ? '1 left' : w.popular ? 'Popular' : '';
                return (
                  <Pressable key={w.id} disabled={off} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: off }}
                    accessibilityLabel={`${w.label}${badge ? ', ' + badge : ''}`}
                    onPress={() => { tapFeedback('select'); setWin(w.id); if (attempted) setErrors(validateBooking(form, w.id)); }}
                    style={{ width: '48.5%', minHeight: 56, borderRadius: radius.md, borderWidth: 1.5, padding: space[2], paddingHorizontal: space[3], justifyContent: 'center',
                      borderColor: on ? colors.green700 : colors.line, backgroundColor: on ? colors.green50 : off ? '#EEF1EF' : colors.surface, opacity: off ? 0.6 : 1 }}>
                    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: off ? colors.ink3 : colors.ink }}>{w.label}</Text>
                    {badge ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: off ? colors.ink3 : w.remaining === 1 ? colors.amber700 : colors.green500 }}>{badge}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : <Muted>No days available.</Muted>}
          {errors.window ? <FieldError message={errors.window} /> : null}
        </View>

        {/* 3 · details */}
        <View style={{ gap: space[3] }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <H3>3 · Your details</H3>
            <Button label="Use my saved details" variant="ghost" small block={false} onPress={useSaved} />
          </Row>
          <View onLayout={mark('firstName')}>
            <Field label="First name" value={form.firstName} onChangeText={(t) => update({ firstName: t })} textContentType="givenName" autoComplete="given-name" error={errors.firstName} returnKeyType="next" />
          </View>
          <View onLayout={mark('lastName')}>
            <Field label="Last name" value={form.lastName} onChangeText={(t) => update({ lastName: t })} textContentType="familyName" autoComplete="family-name" error={errors.lastName} />
          </View>
          <View onLayout={mark('mobile')}>
            <Field label="Mobile" value={form.mobile} onChangeText={(t) => update({ mobile: t })} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel"
              placeholder="0412 345 678" error={errors.mobile} hint="For SMS confirmation and technician updates" />
          </View>
          <View onLayout={mark('email')}>
            <Field label="Email" optional value={form.email} onChangeText={(t) => update({ email: t })} keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" autoComplete="email" error={errors.email} />
          </View>
          <View onLayout={mark('address')}>
            <Field label="Property address" value={form.address} onChangeText={(t) => update({ address: t })} textContentType="fullStreetAddress" autoComplete="street-address"
              placeholder="12 Sydney Rd, Brunswick VIC 3056" error={errors.address} />
          </View>
          <Small style={{ fontFamily: fonts.bodySemi }}>Access</Small>
          <View accessibilityRole="radiogroup" style={{ gap: space[2] }}>
            {ACCESS.map((a) => <Pill key={a} label={a} selected={form.access === a} onPress={() => update({ access: a })} />)}
          </View>
          <Small style={{ fontFamily: fonts.bodySemi }}>Pets or children at home?</Small>
          <Row>
            <Pill label="Yes" selected={pets === 'yes'} onPress={() => setPets('yes')} />
            <Pill label="No" selected={pets === 'no'} onPress={() => setPets('no')} />
          </Row>
          <Field label="Notes for the technician" optional multiline value={form.notes} onChangeText={(t) => update({ notes: t })} />
        </View>

        {/* 4 · confirm */}
        <Card>
          <View onLayout={mark('agree')}><H3>4 · Confirm</H3></View>
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted>Day</Muted><Small style={{ fontFamily: fonts.bodySemi }}>{date ? formatDay(date) : '—'}</Small>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted>Window</Muted><Small style={{ fontFamily: fonts.bodySemi }}>{win ? windowLabel(schedule, win) : 'Choose a window'}</Small>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Muted>Estimate</Muted><Small style={{ fontFamily: fonts.bodySemi }}>{range(est.min, est.max)}</Small>
          </Row>
          <Divider />
          <Checkbox checked={sms} onChange={setSms} label="Send me SMS updates about my booking" />
          <Checkbox checked={form.agree} onChange={(v) => update({ agree: v })} error={errors.agree}
            label="I understand the estimate is indicative and the final price is confirmed on site before any work starts" />
          <Notice tone="green" icon="i-shield">No payment now. You pay the technician after the job by card or bank transfer.</Notice>
          {count ? <Notice tone="red" icon="i-warn">Please fix {count} {count === 1 ? 'item' : 'items'} above before confirming.</Notice> : null}
          <Button label={saving ? 'Saving…' : 'Confirm booking'} iconRight="i-arrow" disabled={saving} onPress={submit} />
          <Timeline steps={[
            { title: 'Estimate', sub: estimate ? estimate.ref : 'Standard price range', state: estimate ? 'done' : 'todo' },
            { title: 'Booking request', sub: "You're here", state: 'now' },
            { title: 'Technician confirmed', sub: 'Usually within 1 hour', state: 'todo' },
            { title: 'Service & report', state: 'todo' },
          ]} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

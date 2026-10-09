/* My Services — merges the sample account (bookings.xml over HTTPS) with bookings made
   in the app (XML on the phone). The website's four ARIA tabs become an iOS segmented
   control: Upcoming · Reports · Properties · Account.
   Cancelling uses a native confirmation alert instead of the web's "tap again" button. */

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, Card, Empty, H2, H3, IconBubble, KV, Loading, Muted, PestVisual, Row, Screen, Small, StatusBadge, Timeline, tapFeedback } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { WEBSITE_URL } from '@/lib/config';
import { formatDay, formatStamp, money, range, toISODate } from '@/lib/format';
import { windowLabel } from '@/lib/schedule';
import { shareBookingsXml } from '@/lib/share';
import { cancelBooking, clearLocalData, exportLocalBookingsXml, type Booking } from '@/lib/store';
import { colors, fonts, radius, space } from '@/lib/theme';

const TABS = ['Upcoming', 'Reports', 'Properties', 'Account'] as const;
type Tab = (typeof TABS)[number];

export default function Services() {
  const { data, bookings, reload, refreshBookings, setEstimate } = useAppData();
  const [tab, setTab] = useState<Tab>('Upcoming');
  const [refreshing, setRefreshing] = useState(false);
  if (!data) return <Loading />;
  const { account, pests, schedule } = data;
  const pestName = (id: string) => pests.find((p) => p.id === id)?.name ?? id;
  const today = toISODate(new Date());

  const latest = bookings.filter((b) => b.source === 'app').sort((a, b) => b.created.localeCompare(a.created))[0];
  const upcoming = bookings.filter((b) => b.date >= today && b.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date) || a.window.localeCompare(b.window));
  const reports = bookings.filter((b) => b.status === 'completed' && b.report);

  const refresh = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  const confirmCancel = (b: Booking) => {
    tapFeedback('warn');
    Alert.alert('Cancel this booking?', `${pestName(b.pest)} on ${formatDay(b.date)}, ${windowLabel(schedule, b.window)}.`, [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: async () => { await cancelBooking(b.ref); await refreshBookings(); tapFeedback('success'); } },
    ]);
  };

  const resetDemo = () => {
    Alert.alert('Reset demo data?', 'This removes the bookings and estimate saved on this iPhone. The sample account stays.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { await clearLocalData(); await setEstimate(null); await refreshBookings(); } },
    ]);
  };

  const exportXml = async () => {
    try {
      await shareBookingsXml(await exportLocalBookingsXml());
    } catch (e) {
      Alert.alert('Could not export', (e as Error).message);
    }
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View>
        <H2>Hi {latest ? latest.contact.firstName : account.customer.firstName}</H2>
        <Muted>Your visits, reports and properties in one place.</Muted>
      </View>

      {/* segmented control */}
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: '#E9EDEA', borderRadius: radius.md, padding: 3 }}>
        {TABS.map((t) => {
          const on = t === tab;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { tapFeedback('select'); setTab(t); }}
              style={{ flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.surface : 'transparent', boxShadow: on ? '0 1px 3px rgba(0, 0, 0, 0.1)' : undefined }}>
              <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.bodyMedium, fontSize: 13, color: on ? colors.green900 : colors.ink2 }}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'Upcoming' && (upcoming.length ? upcoming.map((b) => {
        const tech = account.technicians[b.technician];
        return (
          <Card key={b.ref}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 6 }}>
                <StatusBadge status={b.status} />
                <H3>{pestName(b.pest)}</H3>
                <Muted>Ref {b.ref}</Muted>
              </View>
              <PestVisual id={b.pest} size={56} />
            </Row>
            <KV items={[
              ['When', `${formatDay(b.date)} · ${windowLabel(schedule, b.window)}`],
              ['Where', b.address],
              ['Technician', tech ? `${tech.name} · Lic. ${tech.licence}` : 'Being assigned'],
              ['Estimate', range(b.estimate.min, b.estimate.max)],
            ]} />
            {b.status !== 'cancelled' ? (
              <Timeline steps={[
                { title: 'Request received', sub: b.created ? formatStamp(b.created) : '', state: 'done' },
                { title: 'Technician confirmed', sub: b.status === 'confirmed' ? 'Confirmed' : 'Usually within 1 hour', state: b.status === 'confirmed' ? 'done' : 'now' },
                { title: 'Service & report', sub: 'Report within 24h of the visit', state: 'todo' },
              ]} />
            ) : null}
            {b.source === 'app' && b.status !== 'cancelled' ? <Button label="Cancel booking" icon="i-close" variant="danger" small onPress={() => confirmCancel(b)} /> : null}
          </Card>
        );
      }) : <Empty icon="i-cal" title="No upcoming visits" action={<Button label="Book a service" block={false} onPress={() => router.push('/booking')} />} />)}

      {tab === 'Reports' && (reports.length ? reports.map((b) => (
        <Pressable key={b.ref} accessibilityRole="button" accessibilityLabel={`${b.report!.title}, ${formatDay(b.date, { year: true })}`}
          onPress={() => router.push({ pathname: '/report/[ref]', params: { ref: b.ref } })}>
          {({ pressed }) => (
            <Card style={pressed ? { backgroundColor: colors.green50 } : undefined}>
              <Row>
                <PestVisual id={b.pest} size={48} />
                <View style={{ flex: 1 }}>
                  <H3 numberOfLines={2}>{b.report!.title}</H3>
                  <Muted>{formatDay(b.date, { year: true })} · {b.address.split(',')[0]}{b.price != null ? ` · ${money(b.price)}` : ''}</Muted>
                </View>
                <Icon name="i-chev" size={18} color={colors.ink3} />
              </Row>
            </Card>
          )}
        </Pressable>
      )) : <Empty icon="i-doc" title="No completed visits yet" />)}

      {tab === 'Properties' && [...bookings.reduce((m, b) => m.set(b.address, [...(m.get(b.address) ?? []), b]), new Map<string, Booking[]>())].map(([address, list]) => (
        <Card key={address}>
          <Row>
            <IconBubble name="i-pin" />
            <View style={{ flex: 1 }}>
              <H3>{address}</H3>
              <Muted>{list.length} visit{list.length > 1 ? 's' : ''}</Muted>
            </View>
          </Row>
          {list.map((b) => (
            <Row key={b.ref} style={{ justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[2] }}>
              <View style={{ flex: 1 }}>
                <Small style={{ fontFamily: fonts.bodySemi }}>{pestName(b.pest)}</Small>
                <Muted>{formatDay(b.date, { year: true })}</Muted>
              </View>
              <StatusBadge status={b.status} />
            </Row>
          ))}
        </Card>
      ))}

      {tab === 'Account' && (
        <>
          <Card>
            <H3>Contact details</H3>
            <KV items={[
              ['Name', `${account.customer.firstName} ${account.customer.lastName}`],
              ['Mobile', account.customer.mobile],
              ['Email', account.customer.email],
              ['Home address', account.customer.address],
            ]} />
            <Muted>Sample account from bookings.xml, loaded over HTTPS.</Muted>
          </Card>
          <Card>
            <H3>Your data</H3>
            <Muted>{bookings.filter((b) => b.source === 'app').length} booking(s) made in this app, stored as XML on this iPhone.</Muted>
            <Button label="Share bookings (XML)" icon="i-share" variant="outline" small onPress={exportXml} />
            <Button label="Reset demo data" variant="danger" small onPress={resetDemo} />
          </Card>
          <Pressable accessibilityRole="button" onPress={() => router.push('/security')}>
            <Card>
              <Row>
                <IconBubble name="i-lock" />
                <View style={{ flex: 1 }}>
                  <H3>Data & security</H3>
                  <Muted>HTTPS connection details and request log</Muted>
                </View>
                <Icon name="i-chev" size={18} color={colors.ink3} />
              </Row>
            </Card>
          </Pressable>
          <Button label="Open the website" icon="i-globe" variant="ghost" onPress={() => Linking.openURL(WEBSITE_URL)} />
        </>
      )}
    </Screen>
  );
}

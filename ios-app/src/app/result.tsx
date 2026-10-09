/* Estimate result — price range, how it was calculated (table → stacked rows on a phone),
   what is included / can change the price (pests.xml) and the next three free windows
   (timeslots.xml). Tapping a window opens the booking screen with it pre-selected. */

import { router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Badge, Button, Card, Divider, Empty, Eyebrow, H3, IconBubble, Loading, Muted, Notice, PestVisual, Row, Screen, Small } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { PHONE } from '@/lib/config';
import { formatDay, money, range } from '@/lib/format';
import type { EstimateLine } from '@/lib/pricing';
import { buildDays, nextAvailable } from '@/lib/schedule';
import { colors, fonts, radius, space } from '@/lib/theme';

const signed = (l: EstimateLine) => {
  if (!l.adjust) return range(l.min, l.max);
  if (l.min === 0 && l.max === 0) return '$0';
  return l.min === l.max ? `+${money(l.min)}` : `+${money(l.min)} – ${money(l.max)}`;
};

export default function Result() {
  const { data, estimate: est, bookings } = useAppData();
  if (!data) return <Loading />;
  if (!est) {
    return (
      <Screen>
        <Empty icon="i-dollar" title="No estimate yet" text="Answer five quick questions to see your price range."
          action={<Button label="Get an estimate" block={false} onPress={() => router.navigate('/estimate')} />} />
      </Screen>
    );
  }
  const pest = data.pests.find((p) => p.id === est.answers.pest)!;
  const slotsUsed = bookings.filter((b) => b.source === 'app').map((b) => ({ date: b.date, window: b.window, status: b.status }));
  const slots = nextAvailable(buildDays(data.schedule, slotsUsed), 3);

  return (
    <Screen>
      <Card>
        <Row style={{ alignItems: 'flex-start' }}>
          <PestVisual id={pest.id} size={72} tone={pest.tone} />
          <View style={{ flex: 1, gap: 2 }}>
            <Muted>{est.label} · {est.labels.size} {est.labels.property.toLowerCase()} · {est.labels.area.toLowerCase()} · {est.answers.postcode}</Muted>
            <Text style={{ fontFamily: fonts.headBold, fontSize: 32, color: colors.green900 }}>{range(est.min, est.max)}</Text>
            <Muted>incl. GST · typical visit {est.duration}</Muted>
          </View>
        </Row>
        <Divider />
        <Row style={{ alignItems: 'flex-start' }}>
          <IconBubble name="i-check" />
          <View style={{ flex: 1 }}><H3>Included</H3><Muted>{pest.included}</Muted></View>
        </Row>
        <Row style={{ alignItems: 'flex-start' }}>
          <IconBubble name="i-warn" tone="amber" />
          <View style={{ flex: 1 }}><H3>Can change the price</H3><Muted>{pest.variables}</Muted></View>
        </Row>
        {est.answers.pets ? <Notice tone="green" icon="i-shield">Pets or children at home: the technician will use low-toxicity products.</Notice> : null}
        {pest.tone !== 'green' ? <Notice>{pest.advice}</Notice> : null}
        {est.photos?.length ? <Muted>{est.photos.length} photo{est.photos.length > 1 ? 's' : ''} attached (kept on this iPhone).</Muted> : null}
        <Button label="Book with these details" iconRight="i-arrow" onPress={() => router.push('/booking')} />
        <Button label="Change answers" variant="outline" onPress={() => router.navigate('/estimate')} />
      </Card>

      <Card>
        <H3>How we calculated this</H3>
        {est.lines.map((l) => (
          <View key={l.item} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space[3], paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <View style={{ flex: 1 }}>
              <Small style={{ fontFamily: fonts.bodySemi }}>{l.item}</Small>
              <Muted>{l.basis}</Muted>
            </View>
            <Small style={{ fontFamily: fonts.bodyMedium }}>{signed(l)}</Small>
          </View>
        ))}
        <Row style={{ justifyContent: 'space-between' }}>
          <Small style={{ fontFamily: fonts.bodySemi }}>Indicative total</Small>
          <Text style={{ fontFamily: fonts.head, fontSize: 16, color: colors.green900 }}>{range(est.min, est.max)}</Text>
        </Row>
      </Card>

      <Card>
        <Eyebrow>Next available</Eyebrow>
        {slots.length ? slots.map((sl, i) => (
          <Pressable key={sl.date + sl.id} accessibilityRole="button" accessibilityLabel={`Book ${formatDay(sl.date)}, ${sl.label}`}
            onPress={() => router.push({ pathname: '/booking', params: { date: sl.date, window: sl.id } })}
            style={({ pressed }) => [{ minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: space[3], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, pressed && { backgroundColor: colors.green50 }]}>
            <Small style={{ fontFamily: fonts.bodySemi }}>{formatDay(sl.date)} · {sl.label}</Small>
            <Row style={{ gap: 6 }}>
              {i === 0 ? <Badge label="Earliest" /> : sl.remaining === 1 ? <Badge label="1 left" tone="amber" /> : null}
              <Icon name="i-chev" size={16} color={colors.ink3} />
            </Row>
          </Pressable>
        )) : <Muted>No free windows in the next days — call us.</Muted>}
        <Button label="Choose another time" variant="accent" onPress={() => router.push('/booking')} />
      </Card>

      <Pressable accessibilityRole="button" onPress={() => Linking.openURL(`tel:${PHONE.replace(/\s/g, '')}`)}>
        <Card style={{ backgroundColor: colors.green50 }}>
          <Small style={{ fontFamily: fonts.bodySemi }}>Prefer to talk?</Small>
          <Muted>Call {PHONE} · 7am–7pm. Quote ref {est.ref} and we’ll pick up where you left off.</Muted>
        </Card>
      </Pressable>
    </Screen>
  );
}

/* Home — the website's index.html adapted for a phone:
   hero + two main actions, the "your last estimate" preview card with the next free
   window, how it works, the pest grid (pests.xml + pricing.xml) and a call-to-action. */

import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { PestGrid } from '@/components/PestCard';
import { Badge, Body, Button, Card, Divider, ErrorState, Eyebrow, H2, H3, IconBubble, Loading, Muted, Notice, PestVisual, Row, Screen, Small } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { PHONE } from '@/lib/config';
import { formatDay, range } from '@/lib/format';
import { buildDays, nextAvailable } from '@/lib/schedule';
import { colors, fonts, space } from '@/lib/theme';

const STEPS = [
  ['1', 'Identify', 'Answer three questions about what you saw and where.'],
  ['2', 'Estimate', 'Tell us your property type and size for an honest price range.'],
  ['3', 'Book', 'Pick a date and a 2-hour window. We confirm within the hour.'],
  ['4', 'Report', 'Get a digital service report with findings and follow-up advice.'],
];

export default function Home() {
  const { status, error, data, bookings, estimate, reload } = useAppData();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  if (status === 'loading') return <Loading label="Loading pest data over HTTPS…" />;
  if (status === 'error' || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;

  const slots = bookings.filter((b) => b.source === 'app').map((b) => ({ date: b.date, window: b.window, status: b.status }));
  const [next] = nextAvailable(buildDays(data.schedule, slots), 1);

  const refresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing} contentStyle={{ paddingTop: insets.top + space[3] }}>
      {/* brand bar (replaces the website header; navigation moved to the tab bar) */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: colors.green700, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="i-bug" size={24} color="#fff" />
          </View>
          <View>
            <Text style={{ fontFamily: fonts.headBold, fontSize: 17, color: colors.green900 }}>YI Termite & Pest Control</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1, color: colors.ink3 }}>MELBOURNE</Text>
          </View>
        </Row>
        <Pressable accessibilityRole="button" accessibilityLabel={`Call us on ${PHONE}`} onPress={() => Linking.openURL(`tel:${PHONE.replace(/\s/g, '')}`)}
          style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="i-phone" size={20} color={colors.green900} />
        </Pressable>
      </Row>

      {/* hero */}
      <View style={{ gap: space[3], paddingTop: space[2] }}>
        <Eyebrow>Melbourne · Residential pest control</Eyebrow>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.headBold, fontSize: 32, lineHeight: 38, color: colors.green900, letterSpacing: -0.5 }}>
          Know the pest.{'\n'}Know the <Text style={{ color: colors.green500 }}>price</Text>.{'\n'}Book in minutes.
        </Text>
        <Body style={{ color: colors.ink2 }}>Answer three quick questions to identify what you’ve found, see an upfront estimate, and lock in a licensed technician — no phone call needed.</Body>
        <Button label="Identify a pest" icon="i-search" onPress={() => router.navigate('/identify')} />
        <Button label="Get an estimate" icon="i-dollar" variant="accent" onPress={() => router.navigate('/estimate')} />
        <View style={{ gap: 8, marginTop: 4 }}>
          {[['i-shield', 'Licensed & insured technicians'], ['i-clock', 'Same-week appointments'], ['i-check', 'Upfront price ranges']].map(([icon, label]) => (
            <Row key={label} style={{ gap: 8 }}><Icon name={icon} size={16} color={colors.green700} /><Small style={{ color: colors.ink2 }}>{label}</Small></Row>
          ))}
        </View>
      </View>

      {/* preview card: last estimate + next available window */}
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Badge label={estimate ? 'Your last estimate' : 'Indicative estimate'} />
          <Muted>{estimate ? 'Saved' : 'Example'}</Muted>
        </Row>
        <Row style={{ alignItems: 'flex-start' }}>
          <PestVisual id={estimate?.answers.pest ?? 'cockroach'} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <Muted>Likely pest</Muted>
            <H3>{estimate?.pestName ?? 'German cockroach'}</H3>
            <Muted>{estimate ? `${estimate.labels.area} · ${estimate.labels.size} ${estimate.labels.property.toLowerCase()}` : 'Kitchen · 3-bed house'}</Muted>
          </View>
        </Row>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Muted>Indicative range</Muted>
            <Text style={{ fontFamily: fonts.headBold, fontSize: 24, color: colors.green900 }}>{estimate ? range(estimate.min, estimate.max) : '$180 – $260'}</Text>
          </View>
          <Button label="Book" block={false} small onPress={() => router.push('/booking')} />
        </Row>
        {next ? (
          <Row style={{ gap: 8 }}>
            <IconBubble name="i-cal" tone="amber" size={32} />
            <Small>Next available: <Text style={{ fontFamily: fonts.bodySemi }}>{formatDay(next.date)} · {next.label}</Text></Small>
          </Row>
        ) : null}
        <Muted>Final price confirmed by the technician after inspection.</Muted>
      </Card>

      {/* how it works */}
      <View style={{ gap: space[3], marginTop: space[3] }}>
        <Eyebrow>How it works</Eyebrow>
        <H2>From “what is that?” to “sorted” in four steps</H2>
        {STEPS.map(([n, title, text]) => (
          <Row key={n} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green100, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.headBold, color: colors.green700 }}>{n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <H3>{title}</H3>
              <Muted>{text}</Muted>
            </View>
          </Row>
        ))}
      </View>

      {/* pest grid */}
      <View style={{ gap: space[3], marginTop: space[3] }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Eyebrow>Pest guide</Eyebrow>
            <H2>Common Melbourne pests</H2>
          </View>
        </Row>
        <PestGrid pests={data.pests} bases={data.pricing.bases} />
        <Button label="Not sure? Identify it" variant="outline" iconRight="i-arrow" onPress={() => router.navigate('/identify')} />
      </View>

      {/* why us */}
      <Card style={{ backgroundColor: colors.green900, borderColor: colors.green900, gap: space[4] }}>
        <Eyebrow style={{ color: colors.amber500 }}>Why YI Termite & Pest Control</Eyebrow>
        {[['<60s', 'to an indicative price range'], ['2-hr', 'arrival windows you choose'], ['100%', 'of jobs get a digital report']].map(([k, v]) => (
          <Row key={k}>
            <Text style={{ fontFamily: fonts.headBold, fontSize: 24, color: '#fff', width: 76 }}>{k}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.green100, flex: 1 }}>{v}</Text>
          </Row>
        ))}
      </Card>

      <Notice tone="green" icon="i-lock">All data in this app is loaded over HTTPS. Bookings you make are stored only on this iPhone.</Notice>

      <Card style={{ alignItems: 'stretch', backgroundColor: colors.amber100, borderColor: colors.amber100 }}>
        <H3>Found something you’d rather not have?</H3>
        <Muted>Get an upfront estimate in under a minute. No account needed.</Muted>
        <Button label="Start your estimate" iconRight="i-arrow" onPress={() => router.navigate('/estimate')} />
      </Card>

      <Muted style={{ textAlign: 'center', marginTop: space[2] }}>© 2026 YI Termite & Pest Control · ICT6400 student project</Muted>
    </Screen>
  );
}

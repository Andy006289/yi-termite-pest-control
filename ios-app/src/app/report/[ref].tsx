/* Service report — the website's printable report becomes its own screen with a
   "Share PDF" button (expo-print renders the report to PDF, then the iOS share sheet
   lets the user save it to Files, AirDrop or email it). */

import { useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Card, Eyebrow, H2, H3, Loading, Muted, Notice, PestVisual, Row, Screen, Small } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { formatDay, formatMonth, money } from '@/lib/format';
import { shareReportPdf } from '@/lib/share';
import { colors, fonts, radius, space } from '@/lib/theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <H3 style={{ fontSize: 15 }}>{title}</H3>
      {children}
    </View>
  );
}

export default function ReportScreen() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { data, bookings } = useAppData();
  const [busy, setBusy] = useState(false);
  if (!data) return <Loading />;
  const b = bookings.find((x) => x.ref === ref);
  if (!b?.report) return <Screen><Notice tone="red">Report not found.</Notice></Screen>;
  const r = b.report;
  const tech = data.account.technicians[b.technician];

  const share = async () => {
    setBusy(true);
    try {
      await shareReportPdf(b, data.account);
    } catch (e) {
      Alert.alert('Could not create the PDF', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Row style={{ alignItems: 'flex-start' }}>
        <PestVisual id={b.pest} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Eyebrow>Service report · {b.ref}</Eyebrow>
          <H2 style={{ fontSize: 20, lineHeight: 26 }}>{r.title}</H2>
          <Muted>Completed {formatDay(b.date, { year: true })}{tech ? ` · ${tech.name}` : ''}{b.price != null ? ` · ${money(b.price)}` : ''}</Muted>
        </View>
      </Row>
      <Card>
        <Section title="Findings"><Muted style={{ color: colors.ink }}>{r.findings}</Muted></Section>
        <Section title="Treatment"><Muted style={{ color: colors.ink }}>{r.treatment}</Muted></Section>
        <Section title="Treated areas">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {r.areas.map((a) => (
              <View key={a} style={{ backgroundColor: colors.green100, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.green900 }}>{a}</Text>
              </View>
            ))}
          </View>
        </Section>
        <Section title="Recommendations">
          <Muted style={{ color: colors.ink }}>{r.recommendation} <Text style={{ fontFamily: fonts.bodySemi }}>Next inspection: {formatMonth(r.nextInspection)}.</Text></Muted>
        </Section>
      </Card>
      <Notice tone="green" icon="i-shield">Warranty until {formatDay(r.warrantyUntil, { year: true })}. {r.warranty}</Notice>
      {tech ? <Small style={{ color: colors.ink2 }}>Technician {tech.name} · Licence {tech.licence}</Small> : null}
      <View style={{ gap: space[3] }}>
        <Button label={busy ? 'Preparing PDF…' : 'Share PDF'} icon="i-share" disabled={busy} onPress={share} />
      </View>
    </Screen>
  );
}

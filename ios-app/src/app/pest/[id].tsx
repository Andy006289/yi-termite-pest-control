/* Pest details — the website's <dialog> becomes an iOS modal sheet (swipe down to close). */

import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Badge, Body, Button, Card, Eyebrow, H1, KV, Loading, Muted, Notice, PestVisual, Row, Screen } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { money } from '@/lib/format';
import { space } from '@/lib/theme';

export default function PestDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useAppData();
  if (!data) return <Loading />;
  const p = data.pests.find((x) => x.id === id);
  if (!p) return <Screen><Notice tone="red">Unknown pest.</Notice></Screen>;
  const base = data.pricing.bases[p.id];
  const tone = p.tone === 'red' ? 'red' : p.tone === 'amber' ? 'amber' : 'green';

  return (
    <Screen>
      <Row style={{ alignItems: 'flex-start' }}>
        <PestVisual id={p.id} size={88} tone={tone} />
        <View style={{ flex: 1, gap: 4 }}>
          <Badge label={p.tag} tone={tone} />
          <H1 style={{ fontSize: 26, lineHeight: 32 }}>{p.name}</H1>
          <Muted>{p.species} · <Muted style={{ fontStyle: 'italic' }}>{p.scientific}</Muted></Muted>
        </View>
      </Row>
      <Body>{p.advice}</Body>
      <Card>
        <KV items={[
          ['Usually found', p.where],
          ['Typical price', base ? `${money(base.min)} – ${money(base.max)}` : '—'],
          ['Visit length', base?.duration ?? '—'],
          ['Included', p.included],
          ['Can change', p.variables],
        ]} />
      </Card>
      {p.prep.length ? (
        <Card>
          <Eyebrow>Before we arrive</Eyebrow>
          {p.prep.map((step, i) => <Body key={i} style={{ fontSize: 15 }}>{i + 1}. {step}</Body>)}
        </Card>
      ) : null}
      {p.alsoConsider ? <Muted>Similar pest: {p.alsoConsider}</Muted> : null}
      <View style={{ gap: space[3] }}>
        <Button label="Get an estimate" iconRight="i-arrow" onPress={() => { router.back(); router.navigate({ pathname: '/estimate', params: { pest: p.id } }); }} />
        <Button label="Close" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

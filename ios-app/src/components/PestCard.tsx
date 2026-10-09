/* PestCard.tsx — pest guide card used on Home and the Pest Guide (web: components.js pestCard). */

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Base, Pest } from '@/lib/data';
import { money } from '@/lib/format';
import { colors, fonts, space } from '@/lib/theme';
import { Badge, PestVisual, s, tapFeedback } from './ui';

export function PestCard({ pest, base }: { pest: Pest; base?: Base }) {
  const price = !base ? '' : pest.id === 'termite' ? `Inspection ${money(base.min)}` : `from ${money(base.min)}`;
  const tone = pest.tone === 'red' ? 'red' : pest.tone === 'amber' ? 'amber' : 'green';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pest.name}, ${price}, ${pest.tag}`}
      accessibilityHint="Opens the pest details"
      onPress={() => { tapFeedback(); router.push({ pathname: '/pest/[id]', params: { id: pest.id } }); }}
      style={({ pressed }) => [s.card, { flex: 1, gap: space[2], padding: space[3] }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      <PestVisual id={pest.id} size={56} tone={tone} />
      <Text style={[s.h3, { fontSize: 15 }]} numberOfLines={1}>{pest.name}</Text>
      <Text style={[s.small, { color: colors.ink2, fontSize: 13, lineHeight: 18 }]} numberOfLines={2}>{pest.where}</Text>
      <View style={{ gap: 6, marginTop: 'auto' }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>{price}</Text>
        <Badge label={pest.tag} tone={tone === 'red' ? 'red' : tone === 'amber' ? 'amber' : 'green'} />
      </View>
    </Pressable>
  );
}

/** Two-column grid of pest cards. */
export function PestGrid({ pests, bases }: { pests: Pest[]; bases: Record<string, Base> }) {
  const rows: Pest[][] = [];
  for (let i = 0; i < pests.length; i += 2) rows.push(pests.slice(i, i + 2));
  return (
    <View style={{ gap: space[3] }}>
      {rows.map((row) => (
        <View key={row[0].id} style={{ flexDirection: 'row', gap: space[3] }}>
          {row.map((p) => <PestCard key={p.id} pest={p} base={bases[p.id]} />)}
          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

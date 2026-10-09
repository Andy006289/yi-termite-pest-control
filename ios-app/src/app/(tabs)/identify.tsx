/* Pest Guide — the three-question identification quiz from <quiz> in pests.xml.
   Every answer re-scores all pests (rankPests) and the "Most likely" card updates live.
   On the website the result sat in a side column; on the phone it follows the questions
   and the screen scrolls to it once all three are answered. */

import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PestGrid } from '@/components/PestCard';
import { Badge, Body, Button, Card, ChoiceGrid, Choice, Divider, Empty, Eyebrow, H2, H3, KV, Loading, Muted, Notice, PestVisual, Pill, Row, tapFeedback } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { rankPests } from '@/lib/data';
import { colors, fonts, radius, space } from '@/lib/theme';

export default function Identify() {
  const { data } = useAppData();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const scroll = useRef<ScrollView>(null);
  const resultY = useRef(0);

  if (!data) return <Loading />;
  const { quiz, pests, pricing } = data;
  const answered = Object.keys(answers).length;

  const choose = (q: string, v: string) => {
    const nextAnswers = { ...answers, [q]: v };
    setAnswers(nextAnswers);
    if (Object.keys(nextAnswers).length === quiz.length && answered < quiz.length) {
      tapFeedback('success');
      setTimeout(() => scroll.current?.scrollTo({ y: resultY.current - 12, animated: true }), 150);
    }
  };

  const [best, second] = rankPests(pests, answers);
  const labelOf = (qid: string) => quiz.find((q) => q.id === qid)?.options.find((o) => o.id === answers[qid])?.label ?? '—';
  const level = best && best.confidence >= 0.7 ? 'High' : best && best.confidence >= 0.4 ? 'Medium' : 'Low';
  const pct = best ? Math.round(best.confidence * 100) : 0;

  return (
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: space[4], gap: space[4], paddingBottom: space[7] }}>
      <View style={{ gap: space[2] }}>
        <Eyebrow>Identify a pest</Eyebrow>
        <Body style={{ color: colors.ink2 }}>Not sure what you’ve found? Answer three quick questions and we’ll suggest the most likely pest.</Body>
      </View>

      <Row style={{ justifyContent: 'space-between' }}>
        <Badge label={`${answered} of ${quiz.length} answered`} dot />
        {answered ? <Button label="Start again" variant="ghost" small block={false} onPress={() => setAnswers({})} /> : null}
      </Row>

      {quiz.map((q) => (
        <View key={q.id} style={{ gap: space[3] }}>
          <H2 style={{ fontSize: 19 }}>{q.title}</H2>
          {q.style === 'pills' ? (
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {q.options.map((o) => <Pill key={o.id} label={o.label} selected={answers[q.id] === o.id} onPress={() => choose(q.id, o.id)} />)}
            </View>
          ) : (
            <ChoiceGrid columns={q.id === 'where' ? 3 : 2}>
              {q.options.map((o) => (
                <Choice key={o.id} label={o.label} hint={q.id === 'where' ? undefined : o.hint} icon={o.icon} selected={answers[q.id] === o.id} onPress={() => choose(q.id, o.id)} />
              ))}
            </ChoiceGrid>
          )}
        </View>
      ))}

      {/* live result */}
      <View onLayout={(e) => { resultY.current = e.nativeEvent.layout.y; }} accessibilityLiveRegion="polite">
        {!answered ? (
          <Empty icon="i-search" title="Most likely" text="Answer the questions and we'll suggest the most likely pest here." />
        ) : !best?.score ? (
          <Card><Eyebrow>Most likely</Eyebrow><Muted>No clear match yet — try another answer, or browse the guide below.</Muted></Card>
        ) : (
          <Card>
            <Eyebrow>Most likely</Eyebrow>
            <Row>
              <PestVisual id={best.pest.id} size={72} tone={best.pest.tone} />
              <View style={{ flex: 1 }}>
                <H3>{best.pest.species}</H3>
                <Muted style={{ fontStyle: 'italic' }}>{best.pest.scientific}</Muted>
              </View>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14 }}>Match confidence</Text>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>{level}</Text>
            </Row>
            <View accessibilityRole="progressbar" accessibilityLabel={`Match confidence ${pct}%`} accessibilityValue={{ min: 0, max: 100, now: pct }}
              style={{ height: 10, borderRadius: radius.pill, backgroundColor: colors.green100, overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.green700, borderRadius: radius.pill }} />
            </View>
            <KV items={[['Seen in', labelOf('where')], ['Looked', labelOf('look')], ['Amount', labelOf('count')]]} />
            <Divider />
            <Notice tone={best.pest.tone === 'red' ? 'red' : best.pest.tone === 'amber' ? 'amber' : 'green'}>{best.pest.advice}</Notice>
            <Button label={`Estimate for ${best.pest.name.toLowerCase()}`} iconRight="i-arrow"
              onPress={() => router.navigate({ pathname: '/estimate', params: { pest: best.pest.id } })} />
            {second?.score ? (
              <Button label={`Also consider: ${second.pest.name}`} variant="ghost" small
                onPress={() => router.push({ pathname: '/pest/[id]', params: { id: second.pest.id } })} />
            ) : null}
          </Card>
        )}
      </View>

      <View style={{ gap: space[3], marginTop: space[3] }}>
        <Eyebrow>Pest guide</Eyebrow>
        <H2>Browse all pests</H2>
        <PestGrid pests={pests} bases={pricing.bases} />
      </View>
    </ScrollView>
  );
}

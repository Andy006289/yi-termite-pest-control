/* Get an estimate — the five-step wizard.
   - Option tiles come from pests.xml (pests) and pricing.xml (property, size, area).
   - Each step is validated before Continue; the postcode must be in a service zone.
   - The price range is calculated with calculateEstimate() and revealed on the last step.
   - Mobile additions: sticky Back/Continue bar in thumb reach, numeric keypad for the
     postcode, and real camera / photo library access for pest photos. */

import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Body, Button, Card, Checkbox, Choice, ChoiceGrid, Eyebrow, Field, H2, Loading, Muted, Notice, Pill, Row, tapFeedback } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { range } from '@/lib/format';
import { calculateEstimate, findZone, type EstimateAnswers } from '@/lib/pricing';
import { colors, fonts, radius, space } from '@/lib/theme';

const STEPS = ['Pest', 'Property', 'Size', 'Area', 'Estimate'];
const EMPTY: EstimateAnswers = { pest: null, property: null, size: null, area: null, postcode: '', pets: false, notes: '' };

export default function Estimate() {
  const { data, estimate, setEstimate } = useAppData();
  const params = useLocalSearchParams<{ pest?: string }>();
  // pre-filled from the previous estimate; ?pest= from the Pest Guide or Home wins
  const [answers, setAnswers] = useState<EstimateAnswers>(() => ({ ...EMPTY, ...estimate?.answers, ...(params.pest ? { pest: params.pest } : null) }));
  const [photos, setPhotos] = useState<string[]>(() => estimate?.photos ?? []);
  const [seenPest, setSeenPest] = useState(params.pest);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');
  const [postcodeError, setPostcodeError] = useState('');
  const scroll = useRef<ScrollView>(null);

  // a new ?pest= while the tab is already open restarts the wizard at step 1
  if (params.pest !== seenPest) {
    setSeenPest(params.pest);
    if (params.pest) {
      setAnswers((a) => ({ ...a, pest: params.pest! }));
      setStep(0);
    }
  }

  if (!data) return <Loading />;
  const { pests, pricing } = data;
  const set = (patch: Partial<EstimateAnswers>) => { setAnswers((a) => ({ ...a, ...patch })); setStepError(''); };
  const last = step === STEPS.length - 1;
  const result = last ? calculateEstimate(pricing, answers) : null;
  const zone = findZone(pricing, answers.postcode);

  const checkPostcode = (code = answers.postcode) => {
    let msg = '';
    if (!/^\d{4}$/.test(code)) msg = 'Enter a 4-digit postcode, e.g. 3056';
    else if (!findZone(pricing, code)) msg = `Sorry, we don't service ${code} yet. We cover Melbourne metro and the outer eastern and south-eastern suburbs.`;
    setPostcodeError(msg);
    return !msg;
  };

  const validate = (): boolean => {
    const need = [
      !answers.pest && 'Choose the pest you need help with.',
      !answers.property && 'Choose your property type.',
      !answers.size && 'Choose the property size.',
      !answers.area && 'Choose where the problem is.',
    ][step];
    if (need) { setStepError(need); tapFeedback('warn'); return false; }
    if (step === 2 && !checkPostcode()) { tapFeedback('warn'); return false; }
    return true;
  };

  const go = (to: number) => {
    setStep(to);
    setStepError('');
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  const next = async () => {
    if (!validate()) return;
    if (!last) { go(step + 1); return; }
    const est = calculateEstimate(pricing, answers);
    if ('error' in est) { setStepError(est.error); return; }
    const pest = pests.find((p) => p.id === answers.pest)!;
    await setEstimate({
      ref: 'EST-' + String(Date.now()).slice(-5),
      createdAt: new Date().toISOString(),
      answers: { pest: answers.pest!, property: answers.property!, size: answers.size!, area: answers.area!, postcode: answers.postcode, pets: answers.pets, notes: answers.notes?.trim() },
      pestName: pest.name,
      label: est.label,
      duration: est.duration,
      zoneLabel: est.zone.label,
      labels: { property: est.property.label, size: est.size.label, area: est.area.label },
      min: est.min,
      max: est.max,
      lines: est.lines,
      photos,
    });
    tapFeedback('success');
    router.push('/result');
  };

  /* ---------- photos (camera or library; kept on the phone only) ---------- */
  const addPhoto = async (source: 'camera' | 'library') => {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', `Allow ${source === 'camera' ? 'camera' : 'photo'} access in Settings to add pest photos.`);
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const res = source === 'camera'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: true, selectionLimit: 4 - photos.length });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 4));
  };

  const label = (list: { id: string; label: string }[], id: string | null) => list.find((x) => x.id === id)?.label ?? '—';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* progress */}
      <View style={{ paddingHorizontal: space[4], paddingTop: space[2], paddingBottom: space[3], gap: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.green700 }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</Text>
          <Muted>About 1 minute</Muted>
        </Row>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }} style={{ flexDirection: 'row', gap: 4 }}>
          {STEPS.map((st, i) => (
            <View key={st} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < step ? colors.green700 : i === step ? colors.amber500 : colors.line }} />
          ))}
        </View>
      </View>

      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: space[4], paddingBottom: 140, gap: space[4] }}>
        {step === 0 && (
          <>
            <View style={{ gap: 4 }}>
              <H2>What pest do you need help with?</H2>
              <Row style={{ gap: 4, flexWrap: 'wrap' }}>
                <Muted>Pick the closest match. Not sure?</Muted>
                <Pressable accessibilityRole="link" onPress={() => router.navigate('/identify')} hitSlop={10}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.green700, textDecorationLine: 'underline' }}>Identify it first</Text>
                </Pressable>
              </Row>
            </View>
            <ChoiceGrid columns={2}>
              {pests.map((p) => (
                <Choice key={p.id} label={p.name} hint={p.id === 'termite' ? 'inspection' : undefined} icon={`p-${p.id}`} selected={answers.pest === p.id} onPress={() => set({ pest: p.id })} />
              ))}
            </ChoiceGrid>
          </>
        )}

        {step === 1 && (
          <>
            <View style={{ gap: 4 }}>
              <H2>What type of property is it?</H2>
              <Muted>This affects access, treatment area and how long the visit takes.</Muted>
            </View>
            <ChoiceGrid columns={3}>
              {pricing.properties.map((o) => <Choice key={o.id} label={o.label} hint={o.hint} icon={o.icon} selected={answers.property === o.id} onPress={() => set({ property: o.id })} />)}
            </ChoiceGrid>
          </>
        )}

        {step === 2 && (
          <>
            <View style={{ gap: 4 }}>
              <H2>How big is the property?</H2>
              <Muted>Bedrooms is a good proxy — we’ll confirm on the day.</Muted>
            </View>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
              {pricing.sizes.map((o) => <Pill key={o.id} label={o.label} selected={answers.size === o.id} onPress={() => set({ size: o.id })} />)}
            </View>
            <Field
              label="Postcode"
              value={answers.postcode}
              onChangeText={(t) => {
                const code = t.replace(/\D/g, '').slice(0, 4);
                set({ postcode: code });
                if (code.length === 4 || postcodeError) checkPostcode(code);
              }}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="e.g. 3056"
              textContentType="postalCode"
              autoComplete="postal-code"
              error={postcodeError}
              hint={zone ? `${zone.label} — we service your area.` : 'Used to check we service your area and to add any travel cost.'}
            />
          </>
        )}

        {step === 3 && (
          <>
            <View style={{ gap: 4 }}>
              <H2>Where is the problem?</H2>
              <Muted>Interior-only treatments are quicker; exterior barrier sprays take longer.</Muted>
            </View>
            <ChoiceGrid columns={3}>
              {pricing.areas.map((o) => <Choice key={o.id} label={o.label} icon={o.icon} selected={answers.area === o.id} onPress={() => set({ area: o.id })} />)}
            </ChoiceGrid>
            <Checkbox checked={!!answers.pets} onChange={(v) => set({ pets: v })} label="There are pets or young children in the home (we'll use low-toxicity products)" />
          </>
        )}

        {step === 4 && (
          <>
            <View style={{ gap: 4 }}>
              <H2>Anything else we should know?</H2>
              <Muted>Optional. Photos help us confirm the pest and prepare the right treatment.</Muted>
            </View>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14 }}>Photos</Text>
                <Muted>{photos.length}/4 · stay on this iPhone</Muted>
              </Row>
              {photos.length ? (
                <Row style={{ flexWrap: 'wrap', gap: space[2] }}>
                  {photos.map((uri) => (
                    <Pressable key={uri} accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setPhotos((p) => p.filter((x) => x !== uri))}>
                      <Image source={{ uri }} style={{ width: 70, height: 70, borderRadius: radius.sm }} accessibilityIgnoresInvertColors />
                      <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 10, padding: 2 }}>
                        <Icon name="i-close" size={12} color="#fff" />
                      </View>
                    </Pressable>
                  ))}
                </Row>
              ) : null}
              <Row>
                <Button label="Camera" icon="i-camera" variant="outline" small style={{ flex: 1 }} disabled={photos.length >= 4 || Platform.OS === 'web'} onPress={() => addPhoto('camera')} />
                <Button label="Library" icon="i-image" variant="outline" small style={{ flex: 1 }} disabled={photos.length >= 4} onPress={() => addPhoto('library')} />
              </Row>
            </Card>
            <Field label="Notes" optional multiline value={answers.notes} onChangeText={(t) => set({ notes: t })} placeholder="e.g. mostly under the dishwasher, worse at night" />

            <Card style={{ backgroundColor: colors.green50, borderColor: colors.green100 }}>
              <Eyebrow>Your answers</Eyebrow>
              <Body style={{ fontSize: 15 }}>
                {pests.find((p) => p.id === answers.pest)?.name} · {label(pricing.properties, answers.property)} · {label(pricing.sizes, answers.size)} · {label(pricing.areas, answers.area)} · {answers.postcode}
              </Body>
              <Muted>Indicative range</Muted>
              <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.headBold, fontSize: 30, color: colors.green900 }}>
                {result && !('error' in result) ? range(result.min, result.max) : '—'}
              </Text>
              <Muted>Final price is confirmed by the technician after inspection. No payment is taken in the app.</Muted>
            </Card>
          </>
        )}

        {stepError ? <Notice tone="red" icon="i-warn">{stepError}</Notice> : null}
      </ScrollView>

      {/* sticky action bar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space[3], paddingHorizontal: space[4], backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', gap: space[3] }}>
        <Button label="Back" variant="outline" block={false} style={{ paddingHorizontal: 20 }} disabled={step === 0} onPress={() => go(step - 1)} />
        <Button label={last ? 'See my estimate' : 'Continue'} iconRight="i-arrow" style={{ flex: 1 }} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  );
}

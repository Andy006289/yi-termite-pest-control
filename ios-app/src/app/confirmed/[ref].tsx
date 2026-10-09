/* Booking confirmed — summary of the saved booking, preparation steps for that pest
   (pests.xml) and "Add to calendar": an .ics file handed to the iOS share sheet. */

import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { Button, Card, Empty, Eyebrow, H1, IconBubble, KV, Loading, Muted, Notice, Screen, StatusBadge } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { formatDay, range } from '@/lib/format';
import { windowLabel } from '@/lib/schedule';
import { shareCalendarEvent } from '@/lib/share';
import { colors, fonts, space } from '@/lib/theme';

export default function Confirmed() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { data, bookings } = useAppData();
  if (!data) return <Loading />;
  const b = bookings.find((x) => x.ref === ref);
  if (!b) {
    return (
      <Screen>
        <Empty icon="i-cal" title="Booking not found" text="We couldn't find that booking on this iPhone."
          action={<Button label="Go to My Services" block={false} onPress={() => router.navigate('/services')} />} />
      </Screen>
    );
  }
  const pest = data.pests.find((p) => p.id === b.pest)!;

  const addToCalendar = async () => {
    try {
      await shareCalendarEvent(b, data.schedule, `${pest.name} – YI Termite & Pest Control`);
    } catch (e) {
      Alert.alert('Could not create the calendar file', (e as Error).message);
    }
  };

  return (
    <Screen>
      <Card style={{ alignItems: 'center', paddingVertical: space[6] }}>
        <IconBubble name="i-check" size={72} />
        <StatusBadge status={b.status} />
        <H1 style={{ textAlign: 'center', fontSize: 26, lineHeight: 32 }}>You’re booked in, {b.contact.firstName}</H1>
        <Muted style={{ textAlign: 'center' }}>
          Booking ref <Text style={{ fontFamily: fonts.bodySemi, color: colors.ink }}>{b.ref}</Text>. We’ll text {b.contact.mobile} when a technician is assigned — usually within the hour.
        </Muted>
      </Card>
      <Card>
        <KV items={[
          ['Service', pest.name],
          ['When', `${formatDay(b.date)} · ${windowLabel(data.schedule, b.window)}`],
          ['Where', b.address],
          ['Estimate', range(b.estimate.min, b.estimate.max)],
        ]} />
      </Card>
      <Button label="Add to calendar" icon="i-cal" variant="outline" onPress={addToCalendar} />
      <Button label="View in My Services" onPress={() => router.dismissTo('/services')} />
      {pest.prep.length ? (
        <Card>
          <Eyebrow>Before we arrive</Eyebrow>
          {pest.prep.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space[2] }}>
              <Text style={{ fontFamily: fonts.bodySemi, color: colors.green700 }}>{i + 1}.</Text>
              <Muted style={{ flex: 1, color: colors.ink }}>{step}</Muted>
            </View>
          ))}
        </Card>
      ) : null}
      <Notice tone="green" icon="i-lock">Your booking is saved as XML on this iPhone only. Nothing was sent over the network.</Notice>
      <Button label="Back to Home" variant="ghost" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}

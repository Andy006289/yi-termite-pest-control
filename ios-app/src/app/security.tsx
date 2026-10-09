/* Data & security — evidence that data access is secured by HTTPS.
   Shows the data source, the three layers of protection, where each XML file came from
   on the last load, and the live request log (status, HSTS header, timing). The
   "Try an HTTP request" button demonstrates that a cleartext URL is refused before
   any request is sent. */

import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Eyebrow, H3, IconBubble, Muted, Notice, Row, Screen, Small } from '@/components/ui';
import { useAppData } from '@/lib/AppData';
import { DATA_BASE_URL, DATA_FILES } from '@/lib/config';
import { formatStamp } from '@/lib/format';
import { getRequestLog, secureFetchText, subscribeRequestLog, type RequestLogEntry } from '@/lib/secureFetch';
import { colors, fonts, space } from '@/lib/theme';

const LAYERS: [string, string, string][] = [
  ['i-lock', 'HTTPS-only requests', 'Every request goes through secureFetch, which refuses any URL that is not https:// before anything is sent.'],
  ['i-shield', 'iOS App Transport Security', 'ATS blocks cleartext HTTP for the whole app. No exceptions are configured (NSAllowsArbitraryLoads = false).'],
  ['i-globe', 'HTTPS server with HSTS', 'GitHub Pages serves the XML only over TLS and sends Strict-Transport-Security, so browsers never fall back to HTTP.'],
  ['i-user', 'Personal data stays on the phone', 'Bookings and photos are stored locally in the app sandbox. Nothing personal is uploaded.'],
];

export default function Security() {
  const { sources, loadedAt, reload } = useAppData();
  const [log, setLog] = useState<RequestLogEntry[]>(getRequestLog());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeRequestLog(() => setLog(getRequestLog())), []);

  const tryHttp = async () => {
    const url = DATA_BASE_URL.replace('https://', 'http://') + 'pests.xml';
    try {
      await secureFetchText(url);
      setTestResult('Unexpected: the HTTP request was allowed.');
    } catch (e) {
      setTestResult((e as Error).message);
    }
  };

  const reloadNow = async () => { setBusy(true); await reload(); setBusy(false); };

  return (
    <Screen>
      <Card>
        <Eyebrow>Data source</Eyebrow>
        <Row>
          <IconBubble name="i-lock" />
          <Text selectable style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink }}>{DATA_BASE_URL}</Text>
        </Row>
        <Muted>The same XML files as the Assessment 2 website, served over HTTPS.{loadedAt ? ` Last loaded ${formatStamp(loadedAt)}.` : ''}</Muted>
        <View style={{ gap: 6 }}>
          {DATA_FILES.map((f) => (
            <Row key={f} style={{ justifyContent: 'space-between' }}>
              <Small style={{ fontFamily: fonts.bodySemi }}>{f}.xml</Small>
              {sources[f] ? <Badge label={sources[f]!.source === 'network' ? 'HTTPS · live' : 'Offline copy'} tone={sources[f]!.source === 'network' ? 'green' : 'amber'} /> : <Badge label="Not loaded" tone="grey" />}
            </Row>
          ))}
        </View>
        <Button label={busy ? 'Reloading…' : 'Reload over HTTPS'} icon="i-refresh" variant="outline" small disabled={busy} onPress={reloadNow} />
      </Card>

      <View style={{ gap: space[3] }}>
        <H3>How data access is secured</H3>
        {LAYERS.map(([icon, title, text]) => (
          <Row key={title} style={{ alignItems: 'flex-start' }}>
            <IconBubble name={icon} />
            <View style={{ flex: 1 }}>
              <Small style={{ fontFamily: fonts.bodySemi }}>{title}</Small>
              <Muted>{text}</Muted>
            </View>
          </Row>
        ))}
      </View>

      <Card>
        <H3>Test: HTTP is refused</H3>
        <Muted>Tries to load pests.xml with http:// instead of https://.</Muted>
        <Button label="Try an HTTP request" variant="danger" small onPress={tryHttp} />
        {testResult ? <Notice tone="green" icon="i-shield">{testResult}</Notice> : null}
      </Card>

      <View style={{ gap: space[3] }}>
        <H3>Request log</H3>
        {log.length ? log.map((e, i) => (
          <Card key={i} style={{ gap: 4, padding: space[3] }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Badge label={e.source === 'network' ? `HTTPS ${e.status}` : e.source === 'cache' ? 'Offline copy' : e.source === 'blocked' ? 'Blocked' : 'Failed'}
                tone={e.source === 'network' ? 'green' : e.source === 'blocked' ? 'red' : 'amber'} />
              <Muted>{formatStamp(e.at)}</Muted>
            </Row>
            <Text selectable style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink }}>{e.url}</Text>
            {e.source === 'network' ? (
              <Muted style={{ fontSize: 12 }}>{e.contentType} · {e.bytes?.toLocaleString()} chars · {e.ms} ms{'\n'}HSTS: {e.hsts ?? 'header not readable in the web preview'}</Muted>
            ) : e.error ? <Muted style={{ fontSize: 12 }}>{e.error}</Muted> : null}
          </Card>
        )) : <Muted>No requests yet.</Muted>}
      </View>
    </Screen>
  );
}

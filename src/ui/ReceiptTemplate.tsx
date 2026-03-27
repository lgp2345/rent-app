import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MonthlyFee } from '../types/rental';

export type ReceiptData = {
  buildingName: string;
  floorName: string;
  roomName: string;
  fee: MonthlyFee;
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.row}>
    <Text style={[s.rowLabel, bold && s.boldText]}>{label}</Text>
    <Text style={[s.rowValue, bold && s.boldText, bold && { color: '#2563eb' }]}>{value}</Text>
  </View>
);

const Divider = () => <View style={s.divider} />;

export const ReceiptTemplate = forwardRef<View, ReceiptData>(
  ({ buildingName, floorName, roomName, fee }, ref) => {
    const total = fee.rent + fee.water + fee.electricity + fee.internet + fee.other;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return (
      <View ref={ref} style={s.container} collapsable={false}>
        <Text style={s.title}>收 费 单 据</Text>

        <View style={s.metaRow}>
          <Text style={s.metaText}>
            {buildingName} / {floorName} / {roomName}
          </Text>
          <Text style={s.metaText}>账单月份：{fee.month}</Text>
        </View>

        <Divider />

        <View style={s.section}>
          <Text style={s.sectionTitle}>费用明细</Text>
          <Row label="租金" value={`¥ ${fee.rent.toFixed(2)}`} />
          <Row label="水费" value={`¥ ${fee.water.toFixed(2)}`} />
          {fee.waterUsage != null && (
            <Text style={s.subText}>水表读数：{fee.waterUsage} 吨</Text>
          )}
          <Row label="电费" value={`¥ ${fee.electricity.toFixed(2)}`} />
          {fee.electricityUsage != null && (
            <Text style={s.subText}>电表读数：{fee.electricityUsage} 度</Text>
          )}
          <Row label="网费" value={`¥ ${fee.internet.toFixed(2)}`} />
          {fee.other > 0 && <Row label="其他" value={`¥ ${fee.other.toFixed(2)}`} />}
        </View>

        <Divider />

        <Row label="合计应收" value={`¥ ${total.toFixed(2)}`} bold />

        {fee.note ? (
          <>
            <Divider />
            <View style={s.section}>
              <Text style={s.noteLabel}>备注</Text>
              <Text style={s.noteText}>{fee.note}</Text>
            </View>
          </>
        ) : null}

        <Divider />
        <Text style={s.footerText}>出单日期：{dateStr}</Text>
      </View>
    );
  },
);

const s = StyleSheet.create({
  container: {
    width: 375,
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    letterSpacing: 6,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#cbd5e1',
    marginVertical: 12,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  rowValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  boldText: {
    fontSize: 16,
    fontWeight: '700',
  },
  subText: {
    fontSize: 11,
    color: '#94a3b8',
    paddingLeft: 8,
  },
  noteLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noteText: {
    fontSize: 13,
    color: '#475569',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
});

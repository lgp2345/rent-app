import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MonthlyFee } from '../types/rental';

export type ReceiptData = {
  buildingName: string;
  floorName: string;
  roomName: string;
  fee: MonthlyFee;
  waterPricePerTon?: number;
  electricityPricePerKWh?: number;
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.row}>
    <Text style={[s.rowLabel, bold && s.boldText]}>{label}</Text>
    <Text style={[s.rowValue, bold && s.boldText, bold && { color: '#2563eb' }]}>{value}</Text>
  </View>
);

const Divider = () => <View style={s.divider} />;

export const ReceiptTemplate = forwardRef<View, ReceiptData>(
  ({ buildingName, floorName, roomName, fee, waterPricePerTon = 0, electricityPricePerKWh = 0 }, ref) => {
    const waterPrev = fee.previousSnapshot?.waterUsage ?? 0;
    const waterDiff = fee.waterUsage != null ? fee.waterUsage - waterPrev : 0;
    const waterAmount = fee.waterUsage != null ? waterDiff * waterPricePerTon : fee.water;
    const electricityPrev = fee.previousSnapshot?.electricityUsage ?? 0;
    const electricityDiff = fee.electricityUsage != null ? fee.electricityUsage - electricityPrev : 0;
    const electricityAmount =
      fee.electricityUsage != null ? electricityDiff * electricityPricePerKWh : fee.electricity;
    const total = fee.rent + waterAmount + electricityAmount + fee.internet + fee.other;
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
          <Row label="水费" value={`¥ ${waterAmount.toFixed(2)}`} />
          {fee.waterUsage != null && (
            <View style={s.subBlock}>
              <Text style={s.subText}>
                本月{fee.waterUsage.toFixed(2)} - 上月{waterPrev.toFixed(2)} = {waterDiff.toFixed(2)}
              </Text>
              <Text style={s.subText}>
                {waterDiff.toFixed(2)} × 单价{waterPricePerTon.toFixed(2)} = {waterAmount.toFixed(2)} 元
              </Text>
            </View>
          )}
          <Row label="电费" value={`¥ ${electricityAmount.toFixed(2)}`} />
          {fee.electricityUsage != null && (
            <View style={s.subBlock}>
              <Text style={s.subText}>
                本月{fee.electricityUsage.toFixed(2)} - 上月{electricityPrev.toFixed(2)} ={' '}
                {electricityDiff.toFixed(2)}
              </Text>
              <Text style={s.subText}>
                {electricityDiff.toFixed(2)} × 单价{electricityPricePerKWh.toFixed(2)} ={' '}
                {electricityAmount.toFixed(2)} 元
              </Text>
            </View>
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
  subBlock: {
    gap: 2,
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

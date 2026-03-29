import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Accordion, Dialog } from 'heroui-native';
import { Download, Eye, FileText, Pencil, Share2, Trash2 } from 'lucide-react-native';
import type { MonthlyFee } from '../../types/rental';
import { AmountField } from '../../ui/AmountField';
import { ReceiptTemplate } from '../../ui/ReceiptTemplate';
import { shareReceipt, saveReceiptToAlbum } from '../../utils/receiptCapture';
import { SectionTitle } from '../../ui/SectionTitle';

const asAmount = (value: string) => {
  if (!value.trim()) return 0;
  return Number.parseFloat(value);
};

const FeeRow = ({
  label,
  value,
  unit = '元',
  bold,
}: {
  label: string;
  value: number;
  unit?: string;
  bold?: boolean;
}) => (
  <View className="flex-row justify-between">
    <Text className={`text-sm ${bold ? 'font-bold text-foreground' : 'text-muted'}`}>{label}</Text>
    <Text className={`text-sm ${bold ? 'font-bold text-primary' : 'text-foreground'}`}>
      {value.toFixed(2)} {unit}
    </Text>
  </View>
);

type Props = {
  monthlyFees: MonthlyFee[];
  buildingName: string;
  floorName: string;
  roomName: string;
  waterPricePerTon: number;
  electricityPricePerKWh: number;
  onDelete: (month: string) => void;
  onEdit: (fee: Omit<MonthlyFee, 'id'>) => void;
};

export const MonthlyFeeHistory = ({
  monthlyFees,
  buildingName,
  floorName,
  roomName,
  waterPricePerTon,
  electricityPricePerKWh,
  onDelete,
  onEdit,
}: Props) => {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<MonthlyFee | null>(null);
  const [editTarget, setEditTarget] = useState<MonthlyFee | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<MonthlyFee | null>(null);
  const receiptRef = useRef<View>(null);
  const [editValues, setEditValues] = useState({
    rent: '',
    water: '',
    electricity: '',
    internet: '',
    other: '',
    note: '',
  });

  const feesByYear = useMemo(() => {
    const map = new Map<string, MonthlyFee[]>();
    for (const fee of monthlyFees) {
      const year = fee.month.split('-')[0] ?? '';
      const list = map.get(year) ?? [];
      list.push(fee);
      map.set(year, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthlyFees]);

  return (
    <>
      <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-24">
        <Card.Body className="gap-3 p-5">
          <SectionTitle>历史月份</SectionTitle>
          {feesByYear.length === 0 ? (
            <Card.Description className="py-2">暂无历史账单</Card.Description>
          ) : (
            <Accordion selectionMode="multiple">
              {feesByYear.map(([year, fees]) => {
                const yearTotal = fees.reduce(
                  (sum, f) => sum + f.rent + f.water + f.electricity + f.internet + f.other,
                  0,
                );
                return (
                  <Accordion.Item key={year} value={year}>
                    <Accordion.Trigger>
                      <View className="flex-row items-center flex-1 gap-3">
                        <Text className="font-bold text-lg text-foreground">{year}年</Text>
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                          <Text className="text-xs font-bold text-primary">
                            ¥ {yearTotal.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                    <Accordion.Content>
                      <View className="gap-2 pt-1">
                        {fees.map((fee) => {
                          const feeTotal =
                            fee.rent + fee.water + fee.electricity + fee.internet + fee.other;
                          return (
                            <View
                              key={fee.id}
                              className="flex-row items-center rounded-xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/20"
                            >
                              <Text className="font-medium text-sm text-foreground flex-1">
                                {fee.month}
                              </Text>
                              <Text className="text-sm font-bold text-primary mr-3">
                                ¥{feeTotal.toFixed(2)}
                              </Text>
                              <Pressable
                                className="p-2 rounded-lg active:bg-primary/10"
                                onPress={() => setReceiptTarget(fee)}
                              >
                                <FileText size={18} className="text-muted" />
                              </Pressable>
                              <Pressable
                                className="p-2 rounded-lg active:bg-primary/10"
                                onPress={() => setViewTarget(fee)}
                              >
                                <Eye size={18} className="text-muted" />
                              </Pressable>
                              <Pressable
                                className="p-2 rounded-lg active:bg-primary/10"
                                onPress={() => {
                                  setEditTarget(fee);
                                  setEditValues({
                                    rent: String(fee.rent),
                                    water: String(fee.water),
                                    electricity: String(fee.electricity),
                                    internet: String(fee.internet),
                                    other: String(fee.other),
                                    note: fee.note ?? '',
                                  });
                                }}
                              >
                                <Pencil size={18} className="text-muted" />
                              </Pressable>
                              <Pressable
                                className="p-2 rounded-lg active:bg-danger/10"
                                onPress={() => setDeleteTarget(fee.month)}
                              >
                                <Trash2 size={18} className="text-danger" />
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Card.Body>
      </Card>

      <Dialog
        isOpen={viewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="mb-4 gap-1.5">
              <Dialog.Title>{viewTarget?.month} 账单详情</Dialog.Title>
            </View>
            {viewTarget && (
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View className="gap-2" style={{ minWidth: 300 }}>
                  <FeeRow label="租金" value={viewTarget.rent} />
                  {viewTarget.waterUsage != null ? (
                    <>
                      <FeeRow
                        label="水费"
                        value={
                          (viewTarget.waterUsage - (viewTarget.previousSnapshot?.waterUsage ?? 0)) *
                          waterPricePerTon
                        }
                      />
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-muted">水费明细</Text>
                        <View className="items-end">
                          <Text className="text-sm text-foreground">
                            本月{viewTarget.waterUsage.toFixed(2)} - 上月
                            {(viewTarget.previousSnapshot?.waterUsage ?? 0).toFixed(2)} =
                            {(
                              viewTarget.waterUsage - (viewTarget.previousSnapshot?.waterUsage ?? 0)
                            ).toFixed(2)}
                          </Text>
                          <Text className="text-sm text-foreground">
                            {(
                              viewTarget.waterUsage - (viewTarget.previousSnapshot?.waterUsage ?? 0)
                            ).toFixed(2)}{' '}
                            × 单价{waterPricePerTon.toFixed(2)} ={' '}
                            {(
                              (viewTarget.waterUsage -
                                (viewTarget.previousSnapshot?.waterUsage ?? 0)) *
                              waterPricePerTon
                            ).toFixed(2)}{' '}
                            元
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <FeeRow label="水费" value={viewTarget.water} />
                  )}
                  {viewTarget.electricityUsage != null ? (
                    <>
                      <FeeRow
                        label="电费"
                        value={
                          (viewTarget.electricityUsage -
                            (viewTarget.previousSnapshot?.electricityUsage ?? 0)) *
                          electricityPricePerKWh
                        }
                      />
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-muted">电费明细</Text>
                        <View className="items-end">
                          <Text className="text-sm text-foreground">
                            本月{viewTarget.electricityUsage.toFixed(2)} - 上月
                            {(viewTarget.previousSnapshot?.electricityUsage ?? 0).toFixed(2)} =
                            {(
                              viewTarget.electricityUsage -
                              (viewTarget.previousSnapshot?.electricityUsage ?? 0)
                            ).toFixed(2)}
                          </Text>
                          <Text className="text-sm text-foreground">
                            {(
                              viewTarget.electricityUsage -
                              (viewTarget.previousSnapshot?.electricityUsage ?? 0)
                            ).toFixed(2)}{' '}
                            × 单价{electricityPricePerKWh.toFixed(2)} ={' '}
                            {(
                              (viewTarget.electricityUsage -
                                (viewTarget.previousSnapshot?.electricityUsage ?? 0)) *
                              electricityPricePerKWh
                            ).toFixed(2)}{' '}
                            元
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <FeeRow label="电费" value={viewTarget.electricity} />
                  )}
                  <FeeRow label="网费" value={viewTarget.internet} />
                  <FeeRow label="其他" value={viewTarget.other} />
                  <FeeRow
                    label="合计"
                    value={
                      viewTarget.rent +
                      (viewTarget.waterUsage != null
                        ? (viewTarget.waterUsage - (viewTarget.previousSnapshot?.waterUsage ?? 0)) *
                          waterPricePerTon
                        : viewTarget.water) +
                      (viewTarget.electricityUsage != null
                        ? (viewTarget.electricityUsage -
                            (viewTarget.previousSnapshot?.electricityUsage ?? 0)) *
                          electricityPricePerKWh
                        : viewTarget.electricity) +
                      viewTarget.internet +
                      viewTarget.other
                    }
                    bold
                  />
                  {viewTarget.note ? (
                    <View className="flex-row justify-between pt-1 border-t border-border mt-1">
                      <Text className="text-sm text-muted">备注</Text>
                      <Text className="text-sm text-foreground">{viewTarget.note}</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog
        isOpen={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false}>
            <View className="mb-4 gap-1.5">
              <Dialog.Title>编辑 {editTarget?.month} 账单</Dialog.Title>
            </View>
            <View className="h-[360px]">
              <ScrollView>
                <View className="gap-3">
                  <AmountField
                    label="租金"
                    value={editValues.rent}
                    onChangeText={(t) => setEditValues((p) => ({ ...p, rent: t }))}
                  />
                  <AmountField
                    label="水费"
                    value={editValues.water}
                    onChangeText={(t) => setEditValues((p) => ({ ...p, water: t }))}
                  />
                  <AmountField
                    label="电费"
                    value={editValues.electricity}
                    onChangeText={(t) => setEditValues((p) => ({ ...p, electricity: t }))}
                  />
                  <AmountField
                    label="网费"
                    value={editValues.internet}
                    onChangeText={(t) => setEditValues((p) => ({ ...p, internet: t }))}
                  />
                  <AmountField
                    label="其他费用"
                    value={editValues.other}
                    onChangeText={(t) => setEditValues((p) => ({ ...p, other: t }))}
                  />
                  <TextField>
                    <Label>备注</Label>
                    <Input
                      value={editValues.note}
                      onChangeText={(t) => setEditValues((p) => ({ ...p, note: t }))}
                      placeholder="可选"
                      className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                    />
                  </TextField>
                </View>
              </ScrollView>
            </View>
            <View className="flex-row justify-end gap-3 mt-4">
              <Button variant="ghost" size="sm" onPress={() => setEditTarget(null)}>
                <Button.Label>取消</Button.Label>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={() => {
                  if (editTarget) {
                    onEdit({
                      month: editTarget.month,
                      rent: asAmount(editValues.rent),
                      water: asAmount(editValues.water),
                      waterUsage: editTarget.waterUsage,
                      electricity: asAmount(editValues.electricity),
                      electricityUsage: editTarget.electricityUsage,
                      internet: asAmount(editValues.internet),
                      other: asAmount(editValues.other),
                      note: editValues.note.trim() || undefined,
                    });
                  }
                  setEditTarget(null);
                }}
              >
                <Button.Label>保存</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog
        isOpen={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="mb-5 gap-1.5">
              <Dialog.Title>确认删除</Dialog.Title>
              <Dialog.Description>
                确定要删除 {deleteTarget} 的账单吗？此操作不可撤销。
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setDeleteTarget(null)}>
                <Button.Label>取消</Button.Label>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={() => {
                  if (deleteTarget) onDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
              >
                <Button.Label>确认删除</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog
        isOpen={receiptTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReceiptTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false}>
            <View className="mb-4 gap-1.5">
              <Dialog.Title>{receiptTarget?.month} 收费单据</Dialog.Title>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <ScrollView style={{ maxHeight: 420 }}>
                {receiptTarget && (
                  <ReceiptTemplate
                    ref={receiptRef}
                    buildingName={buildingName}
                    floorName={floorName}
                    roomName={roomName}
                    fee={receiptTarget}
                    waterPricePerTon={waterPricePerTon}
                    electricityPricePerKWh={electricityPricePerKWh}
                  />
                )}
              </ScrollView>
            </ScrollView>
            <View className="flex-row justify-end gap-3 mt-4">
              <Button variant="ghost" size="sm" onPress={() => setReceiptTarget(null)}>
                <Button.Label>关闭</Button.Label>
              </Button>
              <Button variant="secondary" size="sm" onPress={() => saveReceiptToAlbum(receiptRef)}>
                <Download size={16} className="text-foreground" />
                <Button.Label>保存相册</Button.Label>
              </Button>
              <Button variant="primary" size="sm" onPress={() => shareReceipt(receiptRef)}>
                <Share2 size={16} color="#fff" />
                <Button.Label>分享</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
};

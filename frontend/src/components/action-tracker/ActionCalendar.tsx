import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import type { ActionBoardItem } from '@/constants/actionTracker';
import {
  formatDateRange,
  getItemDateRange,
  isDateInRange,
  parseDateKey,
  rangeOverlapsMonth,
  toDateKey,
  toDateKeyFromParts,
} from '@/utils/actionDateRange';
import { getAssigneeColor, getUniqueAssignees } from '@/utils/assigneeColor';

interface ActionCalendarProps {
  items: ActionBoardItem[];
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function ActionCalendar({ items }: ActionCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const itemsWithRange = useMemo(
    () =>
      items
        .map((item) => ({ item, range: getItemDateRange(item) }))
        .filter((entry): entry is { item: ActionBoardItem; range: NonNullable<typeof entry.range> } =>
          Boolean(entry.range),
        ),
    [items],
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ActionBoardItem[]>();

    for (let day = 1; day <= new Date(viewYear, viewMonth + 1, 0).getDate(); day += 1) {
      const dateKey = toDateKeyFromParts(viewYear, viewMonth, day);
      const date = parseDateKey(dateKey);
      const active = itemsWithRange
        .filter(({ range }) => isDateInRange(date, range))
        .map(({ item }) => item);

      if (active.length > 0) {
        map.set(dateKey, active);
      }
    }

    return map;
  }, [itemsWithRange, viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }

    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const todayKey = toDateKey(today);

  const rangeItemsThisMonth = useMemo(
    () =>
      itemsWithRange
        .filter(({ range }) => rangeOverlapsMonth(range, viewYear, viewMonth))
        .map(({ item }) => item)
        .sort((a, b) => {
          const aStart = getItemDateRange(a)?.start.getTime() ?? 0;
          const bStart = getItemDateRange(b)?.start.getTime() ?? 0;
          return aStart - bStart;
        }),
    [itemsWithRange, viewYear, viewMonth],
  );

  const assigneeLegend = useMemo(() => getUniqueAssignees(items), [items]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
      return;
    }
    setViewMonth((m) => m - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
      return;
    }
    setViewMonth((m) => m + 1);
  };

  return (
    <Card
      title="일정 캘린더"
      description="액션 아이템의 시작일부터 마감일까지 기간을 표시합니다. 색상은 담당자별로 구분됩니다."
    >
      <div className="flex flex-col gap-6">
        {assigneeLegend.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assigneeLegend.map((assignee) => {
              const color = getAssigneeColor(assignee);
              return (
                <div
                  key={assignee}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${color.badgeBg} ${color.badgeText}`}
                >
                  <div className={`h-2 w-2 rounded-full ${color.calendarBar}`} />
                  {assignee}
                </div>
              );
            })}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${getAssigneeColor(null).badgeBg} ${getAssigneeColor(null).badgeText}`}
            >
              <div className={`h-2 w-2 rounded-full ${getAssigneeColor(null).calendarBar}`} />
              담당자 미정
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-lg glass px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            이전
          </button>
          <div className="text-base font-semibold text-text-primary">{monthLabel}</div>
          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-lg glass px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            다음
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={`py-2 text-center text-xs font-medium ${
                index === 0 ? 'text-error' : index === 6 ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {label}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-20" />;
            }

            const dateKey = toDateKeyFromParts(viewYear, viewMonth, day);
            const dayItems = itemsByDate.get(dateKey) ?? [];
            const isToday = dateKey === todayKey;

            return (
              <div
                key={dateKey}
                className={`min-h-20 rounded-lg border p-1.5 ${
                  isToday
                    ? 'border-primary bg-primary-subtle'
                    : dayItems.length > 0
                      ? 'border-border-default bg-bg-surface'
                      : 'border-border-default bg-bg-surface'
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isToday ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {day}
                </div>
                {dayItems.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayItems.slice(0, 3).map((item) => {
                      const color = getAssigneeColor(item.assignee);
                      const range = getItemDateRange(item);
                      const isStart = range && toDateKey(range.start) === dateKey;
                      const isEnd = range && toDateKey(range.end) === dateKey;
                      const rangeHint =
                        isStart && isEnd ? '' : isStart ? ' (시작)' : isEnd ? ' (마감)' : '';

                      return (
                        <div
                          key={item.id}
                          className={`truncate rounded px-1 text-[10px] ${color.calendarBar} ${color.badgeText}`}
                          title={`${item.content}${rangeHint}`}
                        >
                          {item.content}
                          {rangeHint}
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-text-muted">+{dayItems.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-text-primary">
            이번 달 일정 ({rangeItemsThisMonth.length})
          </div>
          {rangeItemsThisMonth.length === 0 ? (
            <div className="text-sm text-text-muted">이번 달에 표시할 일정이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {rangeItemsThisMonth.map((item) => {
                const color = getAssigneeColor(item.assignee);
                const rangeLabel = formatDateRange(item);

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg glass px-3 py-2 text-sm"
                  >
                    <div className={`rounded-full px-2 py-0.5 text-xs ${color.badgeBg} ${color.badgeText}`}>
                      {item.assignee ?? '담당자 미정'}
                    </div>
                    <div className="font-medium text-text-primary">{rangeLabel}</div>
                    <div className="text-text-primary">{item.content}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

import type { ReactNode } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ActionSuggestionRow from '@/components/meeting-create/ActionSuggestionRow';
import MeetingActionItemCard from '@/components/meeting-create/MeetingActionItemCard';
import type { ActionItem, Meeting } from '@/api/types';
import { isoToDateKey } from '@/utils/actionApiMapper';
import { getPendingActionSuggestions } from '@/utils/actionSuggestions';

interface MeetingResultPanelProps {
  meeting: Meeting;
  actionItems: ActionItem[];
  addedActionIds?: Set<string>;
  generating?: boolean;
  creatingSuggestion?: string | null;
  onCreateOne: (content: string) => void;
  onGenerateAll: () => void;
  onAddAction: (action: ActionItem) => void;
}

function ResultSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card title={title} description={description}>
      {children}
    </Card>
  );
}

export default function MeetingResultPanel({
  meeting,
  actionItems,
  addedActionIds,
  generating = false,
  creatingSuggestion = null,
  onCreateOne,
  onGenerateAll,
  onAddAction,
}: MeetingResultPanelProps) {
  const { minutes } = meeting;
  const pendingSuggestions = getPendingActionSuggestions(
    meeting,
    actionItems.map((item) => item.content),
  );
  const createdCount = actionItems.length;
  const pendingCount = pendingSuggestions.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-2xl font-bold text-text-primary">생성된 회의록</div>
        <div className="text-sm text-text-secondary">
          AI가 구조화한 회의 요약입니다. 아래 후보를 클릭해 액션을 하나씩 만들거나, 전체 생성으로
          한 번에 추출할 수 있습니다.
        </div>
      </div>

      <ResultSection title="회의 정보">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold text-text-primary">{meeting.title}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
            <div>일자 {isoToDateKey(meeting.date)}</div>
            <div>참석자 {meeting.attendees.length > 0 ? meeting.attendees.join(', ') : '미정'}</div>
          </div>
        </div>
      </ResultSection>

      {minutes?.discussion && (
        <ResultSection title="회의 요약" description="논의 전체를 한눈에 파악할 수 있는 요약입니다.">
          <div className="text-sm leading-relaxed text-text-secondary">{minutes.discussion}</div>
        </ResultSection>
      )}

      {minutes && minutes.agenda.length > 0 && (
        <ResultSection title="안건" description={`${minutes.agenda.length}개 항목`}>
          <div className="flex flex-col gap-2">
            {minutes.agenda.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-lg border border-glass-border bg-bg-surface px-3 py-2 text-sm text-text-secondary"
              >
                {item}
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {minutes && minutes.decisions.length > 0 && (
        <ResultSection title="핵심 내용 · 결정 사항" description={`${minutes.decisions.length}개 항목`}>
          <div className="flex flex-col gap-2">
            {minutes.decisions.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-lg border border-primary/20 bg-primary-subtle/40 px-3 py-2 text-sm text-text-primary"
              >
                {item}
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-lg font-semibold text-text-primary">
                {createdCount > 0 || pendingCount > 0
                  ? `액션 아이템${createdCount > 0 ? ` (${createdCount})` : ''}`
                  : '액션 아이템'}
              </div>
              <div className="text-sm text-text-secondary">
                회의록에서 추출한 할 일 후보입니다. 항목을 클릭하면 1건씩 생성됩니다.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="primary"
              loading={generating}
              onClick={onGenerateAll}
            >
              액션 전체 생성
            </Button>
          </div>

          {pendingCount > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-text-muted">
                추출 후보 {pendingCount}건 · 클릭하여 생성
              </div>
              {pendingSuggestions.map((content) => (
                <ActionSuggestionRow
                  key={content}
                  content={content}
                  loading={creatingSuggestion === content}
                  onCreate={() => onCreateOne(content)}
                />
              ))}
            </div>
          )}

          {createdCount > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-medium text-text-muted">
                생성된 액션 · 담당자·일정 확인 후 트래커에 추가
              </div>
              {actionItems.map((action) => (
                <MeetingActionItemCard
                  key={action.id}
                  action={action}
                  meetingTitle={meeting.title}
                  added={addedActionIds?.has(action.id)}
                  onAdd={onAddAction}
                />
              ))}
            </div>
          ) : pendingCount === 0 ? (
            <div className="text-sm text-text-muted">
              추출할 후보가 없습니다. 「액션 전체 생성」으로 AI가 할 일을 추출해 보세요.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

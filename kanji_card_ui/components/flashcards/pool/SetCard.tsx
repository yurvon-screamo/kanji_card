import * as React from "react";
import { Card, CardHeader, CardFooter, Tag, Text, Button } from "@fluentui/react-components";
import { Set } from "../shared";
import { formatTimeToLearn, getTimeToLearnColor } from "../../../lib/timeUtils";

const statusLabels: Record<string, string> = {
    Tobe: "Новые",
    OneDay: "1 день",
    TwoDay: "2 дня",
    ThreeDay: "3 дня",
    FiveDay: "5 дней",
    SevenDay: "7 дней",
    TenDay: "10 дней",
};

const statusColors: Record<string, "brand" | "danger" | "warning" | "success" | "important"> = {
    Tobe: "brand",
    OneDay: "success",
    TwoDay: "success",
    ThreeDay: "success",
    FiveDay: "warning",
    SevenDay: "warning",
    TenDay: "danger",
};

interface SetCardProps {
    set: Set;
    onClick: () => void;
}

export const SetCard: React.FC<SetCardProps> = ({ set, onClick }) => {
    const status = set.state;
    const statusLabel = statusLabels[status] || status;
    const statusColor = statusColors[status] || "brand";
    const timeColor = getTimeToLearnColor(set.timeToLearn).replace("text-", "");
    const timeLabel = formatTimeToLearn(set.timeToLearn);

    return (
        <Card style={{
            width: '100%',
            minHeight: 220,
            margin: 8,
            cursor: "pointer",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%'
        }} onClick={onClick}>
            <CardHeader
                header={<Text weight="semibold" style={{ wordBreak: 'break-word' }}>{set.words.slice(0, 2).map(w => w.word).join(", ")}{set.words.length > 2 ? "…" : ""}</Text>}
                description={
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                        <Tag appearance="filled" color={statusColor}>{statusLabel}</Tag>
                        <span style={{ color: '#aaa', fontSize: 18, fontWeight: 300 }}>|</span>
                        {set.timeToLearn && (
                            <Tag appearance="outline" color={timeColor}>{timeLabel}</Tag>
                        )}
                    </div>
                }
            />
            <div style={{ margin: "8px 0", flex: 1, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                {set.words.slice(0, 3).map(w => (
                    <Text key={w.id} size={300} block style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {w.word} — {w.meaning}
                    </Text>
                ))}
                {set.words.length > 3 && <Text size={200} block>…</Text>}
            </div>
            <div style={{ flexShrink: 0 }}>
                <CardFooter>
                    <Button appearance="primary" size="small" onClick={e => { e.stopPropagation(); onClick(); }}>Открыть</Button>
                </CardFooter>
            </div>
        </Card>
    );
}; 
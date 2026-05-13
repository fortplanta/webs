import { PromptDefinition } from './prompts';

interface PromptCardProps {
  prompt: PromptDefinition;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('promptId', prompt.id);
    e.dataTransfer.setData('promptid', prompt.id); // lowercase for type detection in dragover
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="prompt-card"
      draggable
      onDragStart={handleDragStart}
    >
      <span className="prompt-card__icon">{prompt.icon}</span>
      <div className="prompt-card__content">
        <div className="prompt-card__label">{prompt.label}</div>
        <div className="prompt-card__description">{prompt.description}</div>
      </div>
    </div>
  );
}

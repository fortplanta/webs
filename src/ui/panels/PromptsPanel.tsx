import { PROMPTS } from '../../prompts/prompts';
import PromptCard from '../../prompts/PromptCard';

export default function PromptsPanel() {
  return (
    <div className="prompts-panel">
      <div className="prompts-panel__category-label">Analysis</div>
      {PROMPTS.map(p => (
        <PromptCard key={p.id} prompt={p} />
      ))}
    </div>
  );
}

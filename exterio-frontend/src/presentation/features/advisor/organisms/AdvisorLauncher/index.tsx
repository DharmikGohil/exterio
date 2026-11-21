import { Button } from '@/presentation/shared/atoms/Button';
import { useDisclosure } from '@/presentation/shared/hooks/useDisclosure';
import { cn } from '@/presentation/shared/utils/cn';
import { AdvisorPanel } from '@/presentation/features/advisor/organisms/AdvisorPanel';
import { useCapabilities } from '@/presentation/features/system/hooks/useCapabilities';

export interface AdvisorLauncherProps {
  projectId: string;
  designId: string | undefined;
  designName: string | undefined;
}

/**
 * The "Ask about materials" button for the studio top bar, and its chat panel.
 * Renders nothing when the server has no advisor configured.
 * The panel stays mounted while closed so the conversation is kept.
 */
export function AdvisorLauncher({ projectId, designId, designName }: AdvisorLauncherProps) {
  const { capabilities } = useCapabilities();
  const panel = useDisclosure();

  if (!capabilities.advisor) {
    return null;
  }

  return (
    <>
      {!panel.isOpen && (
        <Button variant="outline" size="sm" icon="message" onClick={panel.open}>
          <span className="hidden xl:inline">Ask about materials</span>
          <span className="xl:hidden">Advisor</span>
        </Button>
      )}
      <div className={cn(!panel.isOpen && 'hidden')}>
        <AdvisorPanel
          projectId={projectId}
          designId={designId}
          designName={designName}
          isOpen={panel.isOpen}
          onClose={panel.close}
        />
      </div>
    </>
  );
}

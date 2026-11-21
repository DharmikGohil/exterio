import { useMutation } from '@tanstack/react-query';

import type { Design } from '@/domain/models/design';
import { useEstimateContext } from '@/presentation/features/estimate/contexts/EstimateContext';
import { useToast } from '@/presentation/shared/hooks/useToast';
import { downloadBlob, toFileSlug } from '@/presentation/shared/utils/download';

/** Fetches the PDF report (with the auth header) and saves it to the user's device. */
export function useReportDownload(projectName: string) {
  const { estimateService } = useEstimateContext();
  const toast = useToast();

  const { mutate: downloadReport, isPending: isDownloading } = useMutation({
    mutationFn: (design: Design) => estimateService.getReport(design.id),
    onSuccess: (blob, design) => {
      const fileName = `${toFileSlug(projectName, 'project')}-${toFileSlug(design.name, 'design')}-estimate.pdf`;
      downloadBlob(blob, fileName);
      toast.success('Your report has been downloaded.');
    },
    onError: (error) => toast.error(error),
  });

  return { downloadReport, isDownloading };
}

interface StreamResultSkeletonProps {
  label: string;
}

export const StreamResultSkeleton = ({ label }: StreamResultSkeletonProps) => (
  <div
    role='status'
    aria-busy='true'
    aria-label={`${label} is streaming`}
    className='min-h-36 border-t pt-5'
  >
    <div className='animate-pulse space-y-4 motion-reduce:animate-none'>
      <div className='h-5 w-2/3 rounded bg-muted' />
      <div className='space-y-2'>
        <div className='h-4 w-full rounded bg-muted' />
        <div className='h-4 w-4/5 rounded bg-muted' />
      </div>
      <div className='h-6 w-36 rounded-full bg-primary/10' />
    </div>
    <span className='sr-only'>Streaming {label}</span>
  </div>
);

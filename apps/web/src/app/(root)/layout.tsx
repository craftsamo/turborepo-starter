import type { LayoutProps } from '@workspace/types/web';

export default async function RootLayout(props: LayoutProps) {
  return (
    <main
      className={` 
          h-[calc(100svh-4rem)] 
          snap-y overflow-y-auto snap-mandatory no-scrollbar
        `}
    >
      {props.children}
    </main>
  );
}

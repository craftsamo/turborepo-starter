# UI Config

## Usage

This package can be imported and used as follows:

```tsx
'use client';

import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useMobile } from '@workspace/ui/hooks/use-mobile';

export const CustomButton = () => {
  return <Button>Click me!</Button>;
};
```

## How to Add Components

You can add new components to this package by running the following command:

```bash
cd packages/ui && pnpm dlx shadcn add {component}
```

You can check the components available for addition [here](https://ui.shadcn.com/docs/components).

# Logger

## Overview

The `logger` package provides a centralized and customizable logging solution for applications within the workspace. It simplifies logging management and ensures consistency across projects by offering flexible configuration options.

## Key Features

- **Customizable Log Levels**: Supports various log levels (e.g., INFO, DEBUG, ERROR).
- **Flexible Output Options**: Allows logging to the console, files, or external services.
- **Formatted Messages**: Offers customizable message formats.
- **Lightweight and Dependency-Free**: No runtime dependencies, ensuring minimal overhead.

## Usage

To use the logger in your project, follow these steps:

### Installation

Ensure the `logger` package is installed as a dependency in your project. Import and initialize the logger as follows:

```typescript
import { NextStructuredLogger } from '@workspace/logger';

const logger = new NextStructuredLogger({
  level: 'info',
  format: 'json',
});

logger.info('Logger initialized successfully!');
logger.error('An error occurred!', { errorCode: 123 });
```

## Configuration

The logger supports various configuration options:

- **level**: Specifies the minimum log level to capture (e.g., 'info', 'debug').
- **format**: Defines the log message format (e.g., 'json', 'text').

### Advanced Usage

#### JSON Format Example

```typescript
import { NextStructuredLogger } from '@logger';

const logger = new NextStructuredLogger({
  name: 'NextApp',
  level: 'debug',
  format: 'json',
});

logger.log('Hello World', { userId: 1 }); // Outputs log in JSON format
```

#### Text Format Example

```typescript
import { NextStructuredLogger } from '@logger';

const logger = new NextStructuredLogger({
  name: 'NextApp',
  level: 'debug',
  format: 'text',
});

logger.debug('Start Debugging', 'Initialization phase'); // Outputs log in text format
```

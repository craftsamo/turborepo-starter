import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";

export interface FileEntry {
  path: string;
  content: string;
}

export interface FileOperations {
  exists(filePath: string): boolean;
  read(filePath: string): string;
  mkdir(directoryPath: string): void;
  write(filePath: string, content: string): void;
  rename(from: string, to: string): void;
  remove(filePath: string): void;
  warn(message: string): void;
}

interface StagedFile {
  target: string;
  temporary: string;
  backup: string;
  hadOriginal: boolean;
  installed: boolean;
}

export const nodeFileOperations: FileOperations = {
  exists: existsSync,
  read: (filePath) => readFileSync(filePath, "utf8"),
  mkdir: (directoryPath) => mkdirSync(directoryPath, { recursive: true }),
  write: (filePath, content) => writeFileSync(filePath, content, "utf8"),
  rename: renameSync,
  remove: (filePath) => rmSync(filePath, { force: true }),
  warn: (message) => console.warn(message),
};

export function applyFileTransaction(
  root: string,
  entries: FileEntry[],
  operations: FileOperations = nodeFileOperations,
): void {
  const changed = entries.filter(({ path: relativePath, content }) => {
    const target = path.join(root, relativePath);
    return !operations.exists(target) || operations.read(target) !== content;
  });
  const staged: StagedFile[] = [];

  try {
    for (const [index, { path: relativePath, content }] of changed.entries()) {
      const target = path.join(root, relativePath);
      operations.mkdir(path.dirname(target));
      const temporary = `${target}.setup-project-${process.pid}-${index}`;
      const backup = `${temporary}.backup`;
      if (operations.exists(backup)) {
        throw new Error(`Refusing to overwrite stale backup ${backup}.`);
      }
      operations.write(temporary, content);
      staged.push({
        target,
        temporary,
        backup,
        hadOriginal: false,
        installed: false,
      });
    }
    for (const file of staged) {
      if (operations.exists(file.target)) {
        operations.rename(file.target, file.backup);
        file.hadOriginal = true;
      }
      operations.rename(file.temporary, file.target);
      file.installed = true;
    }
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const file of [...staged].reverse()) {
      try {
        if (file.installed) operations.remove(file.target);
        if (file.hadOriginal && operations.exists(file.backup)) {
          operations.rename(file.backup, file.target);
        }
      } catch (rollbackError) {
        rollbackErrors.push(
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError),
        );
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} Rollback failed: ${rollbackErrors.join("; ")}`,
      );
    }
    throw error;
  } finally {
    for (const file of staged) {
      try {
        operations.remove(file.temporary);
      } catch (error) {
        operations.warn(
          `Could not remove temporary file ${file.temporary}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  const cleanupErrors: string[] = [];
  for (const file of staged) {
    try {
      operations.remove(file.backup);
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (cleanupErrors.length > 0) {
    operations.warn(
      `Project files were updated, but backup cleanup failed: ${cleanupErrors.join("; ")}`,
    );
  }
}

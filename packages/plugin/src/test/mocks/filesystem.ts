/**
 * Mock File System
 *
 * 内存文件系统模拟器，用于测试文件操作而不影响实际文件系统
 */

import { basename, dirname, normalize } from "node:path";

/**
 * 文件系统操作选项
 */
export interface FileSystemOptions {
  /** 是否自动创建父目录 */
  autoCreateParents?: boolean;
  /** 文件权限模拟（不实际使用，仅用于API兼容） */
  permissions?: number;
}

/**
 * Mock文件系统类
 */
export class MockFileSystem {
  private files: Map<string, string>;
  private directories: Set<string>;
  private autoCreateParents: boolean;

  constructor(options?: FileSystemOptions) {
    this.files = new Map();
    this.directories = new Set();
    this.autoCreateParents = options?.autoCreateParents ?? true;
  }

  /**
   * 规范化路径
   */
  private normalizePath(path: string): string {
    return normalize(path).replace(/\\/g, "/");
  }

  /**
   * 确保父目录存在
   */
  private ensureParentDirectory(path: string): void {
    const parent = dirname(path);
    if (parent && parent !== "." && parent !== "/") {
      if (!this.directories.has(parent)) {
        this.directories.add(parent);
      }
    }
  }

  /**
   * 写入文件
   */
  writeFile(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);

    if (this.autoCreateParents) {
      this.ensureParentDirectory(normalizedPath);
    }

    this.files.set(normalizedPath, content);
  }

  /**
   * 读取文件
   */
  readFile(path: string): string | null {
    const normalizedPath = this.normalizePath(path);
    return this.files.get(normalizedPath) ?? null;
  }

  /**
   * 读取JSON文件
   */
  readJson<T = unknown>(path: string): T | null {
    const content = this.readFile(path);
    if (!content) {
      return null;
    }
    try {
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * 检查文件或目录是否存在
   */
  exists(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return (
      this.files.has(normalizedPath) ||
      this.directories.has(normalizedPath)
    );
  }

  /**
   * 检查是否为文件
   */
  isFile(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.has(normalizedPath);
  }

  /**
   * 检查是否为目录
   */
  isDirectory(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.directories.has(normalizedPath);
  }

  /**
   * 删除文件
   */
  unlink(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.delete(normalizedPath);
  }

  /**
   * 创建目录
   */
  mkdir(path: string, recursive: boolean = true): void {
    const normalizedPath = this.normalizePath(path);

    if (recursive) {
      // 递归创建所有父目录
      const parts = normalizedPath.split("/").filter(Boolean);
      let current = "";

      for (const part of parts) {
        current = current ? `${current}/${part}` : `/${part}`;
        this.directories.add(current);
      }
    } else {
      this.directories.add(normalizedPath);
    }
  }

  /**
   * 删除目录
   */
  rmdir(path: string): boolean {
    const normalizedPath = this.normalizePath(path);

    // 删除目录本身
    const deleted = this.directories.delete(normalizedPath);

    // 删除目录下的所有文件
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(normalizedPath + "/")) {
        this.files.delete(filePath);
      }
    }

    return deleted;
  }

  /**
   * 列出目录内容
   */
  readdir(path: string): string[] {
    const normalizedPath = this.normalizePath(path);
    const prefix = normalizedPath.endsWith("/")
      ? normalizedPath
      : `${normalizedPath}/`;

    const entries: string[] = [];

    // 查找直接子文件和目录
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix)) {
        const relative = filePath.slice(prefix.length);
        const firstPart = relative.split("/")[0];
        if (firstPart && !entries.includes(firstPart)) {
          entries.push(firstPart);
        }
      }
    }

    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix) && dirPath !== normalizedPath) {
        const relative = dirPath.slice(prefix.length);
        const firstPart = relative.split("/")[0];
        if (firstPart && !entries.includes(firstPart)) {
          entries.push(firstPart);
        }
      }
    }

    return entries;
  }

  /**
   * 重命名文件
   */
  rename(oldPath: string, newPath: string): boolean {
    const normalizedOld = this.normalizePath(oldPath);
    const normalizedNew = this.normalizePath(newPath);

    const content = this.files.get(normalizedOld);
    if (content === undefined) {
      return false;
    }

    this.files.set(normalizedNew, content);
    this.files.delete(normalizedOld);

    if (this.autoCreateParents) {
      this.ensureParentDirectory(normalizedNew);
    }

    return true;
  }

  /**
   * 复制文件
   */
  copy(srcPath: string, destPath: string): boolean {
    const normalizedSrc = this.normalizePath(srcPath);
    const normalizedDest = this.normalizePath(destPath);

    const content = this.files.get(normalizedSrc);
    if (content === undefined) {
      return false;
    }

    this.files.set(normalizedDest, content);

    if (this.autoCreateParents) {
      this.ensureParentDirectory(normalizedDest);
    }

    return true;
  }

  /**
   * 获取文件统计信息
   */
  stat(path: string): { size: number; isFile: boolean; isDirectory: boolean } | null {
    const normalizedPath = this.normalizePath(path);

    const fileContent = this.files.get(normalizedPath);
    if (fileContent !== undefined) {
      return {
        size: fileContent.length,
        isFile: true,
        isDirectory: false,
      };
    }

    if (this.directories.has(normalizedPath)) {
      return {
        size: 0,
        isFile: false,
        isDirectory: true,
      };
    }

    return null;
  }

  /**
   * 获取所有文件路径
   */
  getAllFiles(): string[] {
    return Array.from(this.files.keys());
  }

  /**
   * 获取所有目录路径
   */
  getAllDirectories(): string[] {
    return Array.from(this.directories.values());
  }

  /**
   * 重置文件系统
   */
  reset(): void {
    this.files.clear();
    this.directories.clear();
  }

  /**
   * 获取文件数量
   */
  getFileCount(): number {
    return this.files.size;
  }

  /**
   * 获取目录数量
   */
  getDirectoryCount(): number {
    return this.directories.size;
  }

  /**
   * 检查文件系统是否为空
   */
  isEmpty(): boolean {
    return this.files.size === 0 && this.directories.size === 0;
  }

  /**
   * 导出文件系统状态（用于调试）
   */
  export(): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [path, content] of this.files.entries()) {
      result[path] = content;
    }

    return result;
  }

  /**
   * 导入文件系统状态（用于快速设置测试状态）
   */
  import(data: Record<string, string>): void {
    this.reset();

    for (const [path, content] of Object.entries(data)) {
      this.writeFile(path, content);
    }
  }

  /**
   * 查找匹配模式的文件
   */
  glob(pattern: string): string[] {
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/\./g, "\\.")
          .replace(/\*/g, ".*")
          .replace(/\?/g, ".") +
        "$"
    );

    return Array.from(this.files.keys()).filter((path) =>
      regex.test(basename(path))
    );
  }

  /**
   * 创建模拟的 fs 模块（用于模块替换）
   */
  createMockFs() {
    const self = this;
    return {
      readFileSync: (path: string, _encoding: string): string => {
        const content = self.readFile(path);
        if (content === null) {
          const error: NodeJS.ErrnoException = new Error(
            `ENOENT: no such file or directory, open '${path}'`
          );
          error.code = "ENOENT";
          throw error;
        }
        return content;
      },
      writeFileSync: (path: string, content: string): void => {
        self.writeFile(path, content);
      },
      existsSync: (path: string): boolean => {
        return self.exists(path);
      },
      unlinkSync: (path: string): void => {
        self.unlink(path);
      },
      mkdirSync: (path: string, options?: { recursive: boolean }): void => {
        self.mkdir(path, options?.recursive ?? true);
      },
      readdirSync: (path: string): string[] => {
        return self.readdir(path);
      },
    };
  }
}

/**
 * 创建默认配置的Mock文件系统
 */
export function createMockFileSystem(
  options?: FileSystemOptions
): MockFileSystem {
  return new MockFileSystem(options);
}

/**
 * 文件系统测试辅助类
 */
export class FileSystemTestHelper {
  private fs: MockFileSystem;
  private basePath: string;

  constructor(basePath: string = "/test") {
    this.fs = new MockFileSystem();
    this.basePath = basePath;

    // 创建基础目录
    this.fs.mkdir(basePath, true);
  }

  /**
   * 获取文件系统实例
   */
  getFileSystem(): MockFileSystem {
    return this.fs;
  }

  /**
   * 创建测试文件
   */
  createFile(relativePath: string, content: string): void {
    const fullPath = this.basePath + "/" + relativePath;
    this.fs.writeFile(fullPath, content);
  }

  /**
   * 读取测试文件
   */
  readFile(relativePath: string): string | null {
    const fullPath = this.basePath + "/" + relativePath;
    return this.fs.readFile(fullPath);
  }

  /**
   * 检查文件是否存在
   */
  exists(relativePath: string): boolean {
    const fullPath = this.basePath + "/" + relativePath;
    return this.fs.exists(fullPath);
  }

  /**
   * 删除文件
   */
  deleteFile(relativePath: string): boolean {
    const fullPath = this.basePath + "/" + relativePath;
    return this.fs.unlink(fullPath);
  }

  /**
   * 清空文件系统
   */
  clear(): void {
    this.fs.reset();
    this.fs.mkdir(this.basePath, true);
  }

  /**
   * 快速创建多个文件
   */
  createFiles(files: Record<string, string>): void {
    for (const [path, content] of Object.entries(files)) {
      this.createFile(path, content);
    }
  }

  /**
   * 验证文件内容
   */
  assertFileContent(relativePath: string, expectedContent: string): boolean {
    const actualContent = this.readFile(relativePath);
    return actualContent === expectedContent;
  }
}

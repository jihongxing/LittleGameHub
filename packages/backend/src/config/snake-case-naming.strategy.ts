/**
 * Snake Case Naming Strategy for TypeORM
 * 自动将 camelCase 实体属性映射到 snake_case 数据库列
 */

import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  /**
   * 表名转换
   */
  tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ? userSpecifiedName : this.toSnakeCase(targetName);
  }

  /**
   * 列名转换
   */
  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    if (customName) {
      return customName;
    }

    const prefix = embeddedPrefixes.length > 0
      ? embeddedPrefixes.join('_') + '_'
      : '';

    return prefix + this.toSnakeCase(propertyName);
  }

  /**
   * 关系名转换
   */
  relationName(propertyName: string): string {
    return this.toSnakeCase(propertyName);
  }

  /**
   * 连接列名转换
   */
  joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.toSnakeCase(relationName) + '_' + this.toSnakeCase(referencedColumnName);
  }

  /**
   * 连接表名转换
   */
  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    secondPropertyName: string,
  ): string {
    return (
      this.toSnakeCase(firstTableName) +
      '_' +
      this.toSnakeCase(secondTableName)
    );
  }

  /**
   * 连接表列名转换
   */
  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return (
      this.toSnakeCase(tableName) +
      '_' +
      (columnName ? columnName : this.toSnakeCase(propertyName))
    );
  }

  /**
   * 索引名转换
   */
  indexName(
    tableOrName: string | any,
    columnNames: string[],
    where?: string,
  ): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : (tableOrName.name || String(tableOrName));
    const replacedTableName = tableName.replace('.', '_');
    const replacedColumnNames = columnNames.join('_');

    return `IDX_${replacedTableName}_${replacedColumnNames}`;
  }

  /**
   * 外键名转换
   */
  foreignKeyName(
    tableOrName: string | any,
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[],
  ): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : (tableOrName.name || String(tableOrName));
    const replacedTableName = tableName.replace('.', '_');
    const replacedColumnNames = columnNames.join('_');

    return `FK_${replacedTableName}_${replacedColumnNames}`;
  }

  /**
   * 唯一约束名转换
   */
  uniqueConstraintName(tableOrName: string | any, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : (tableOrName.name || String(tableOrName));
    const replacedTableName = tableName.replace('.', '_');
    const replacedColumnNames = columnNames.join('_');

    return `UQ_${replacedTableName}_${replacedColumnNames}`;
  }

  /**
   * 主键名转换
   */
  primaryKeyName(tableOrName: string | any, columnNames: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : (tableOrName.name || String(tableOrName));
    const replacedTableName = tableName.replace('.', '_');
    const replacedColumnNames = columnNames.join('_');

    return `PK_${replacedTableName}_${replacedColumnNames}`;
  }

  /**
   * CamelCase 转 snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '');
  }
}


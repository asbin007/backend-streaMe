import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, HasMany } from 'sequelize-typescript';
import { Episode } from './Episode';

@Table({
  tableName: 'series',
  timestamps: true,
})
export class Series extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  genre!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  releaseYear!: string;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  rating!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  coverImage!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  backdropImage!: string;

  @HasMany(() => Episode)
  episodes!: Episode[];

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

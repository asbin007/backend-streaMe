import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'movies',
  timestamps: true,
})
export class Movie extends Model {
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
  duration!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  videoUrl!: string;

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

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

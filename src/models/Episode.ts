import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Series } from './Series';

@Table({
  tableName: 'episodes',
  timestamps: true,
})
export class Episode extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  seriesId!: string;

  @BelongsTo(() => Series)
  series!: Series;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  seasonNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  episodeNumber!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  videoUrl!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  thumbnail!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

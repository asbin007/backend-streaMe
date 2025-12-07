import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'watch_history',
  timestamps: true,
})
export class WatchHistory extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  mediaId!: string;

  @Column({
    type: DataType.ENUM('movie', 'tv'),
    allowNull: false,
  })
  mediaType!: 'movie' | 'tv';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  posterPath!: string;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  progress!: number; // Percentage watched or timestamp

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
  })
  duration!: number; // Total duration

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  lastWatchedAt!: Date;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

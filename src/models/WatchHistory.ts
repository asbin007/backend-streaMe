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

  /**
   * Which episode the viewer was on, for `mediaType: 'tv'`. Null for films.
   *
   * Without these, history could say "you watched Breaking Bad" but not where
   * you were, so "Continue Watching" could only ever link back to the show
   * page and make the viewer find the episode again.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  season!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  episode!: number | null;

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

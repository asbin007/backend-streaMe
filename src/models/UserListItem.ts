import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, Index } from 'sequelize-typescript';
import { User } from './User';

@Table({
  tableName: 'user_list_items',
  timestamps: true,
})
export class UserListItem extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @ForeignKey(() => User)
  @Index('user_list_unique')
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Index('user_list_unique')
  @Column({
    type: DataType.ENUM('watchlist', 'favorite'),
    allowNull: false,
  })
  listType!: 'watchlist' | 'favorite';

  @Index('user_list_unique')
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  mediaId!: string;

  @Index('user_list_unique')
  @Column({
    type: DataType.ENUM('movie', 'tv'),
    allowNull: false,
  })
  mediaType!: 'movie' | 'tv';

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  posterPath!: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

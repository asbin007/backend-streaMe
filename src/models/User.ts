import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, HasMany } from 'sequelize-typescript';
import { WatchHistory } from './WatchHistory';
import { UserListItem } from './UserListItem';
import { PushToken } from './PushToken';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
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
  username!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  password!: string;

  /**
   * Clerk's user id (`user_...`). Identity now lives in Clerk; this table keeps
   * the local row so watch history, lists, and push tokens retain their foreign
   * keys. Nullable because rows created before the migration are linked lazily,
   * by email, the first time that person signs in through Clerk.
   */
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  clerkId!: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  googleId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatarUrl!: string;

  @Column({
    type: DataType.ENUM('user', 'admin', 'super_admin'),
    defaultValue: 'user',
  })
  role!: 'user' | 'admin' | 'super_admin';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  otp!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  otpGeneratedTime!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isVerified!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastVisitedAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastNotificationSentAt!: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  reminderEmailEnabled!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @HasMany(() => WatchHistory)
  watchHistory!: WatchHistory[];

  @HasMany(() => UserListItem)
  listItems!: UserListItem[];

  @HasMany(() => PushToken)
  pushTokens!: PushToken[];
}

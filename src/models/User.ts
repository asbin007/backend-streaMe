import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, HasMany } from 'sequelize-typescript';
import { WatchHistory } from './WatchHistory';

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
    allowNull: false,
  })
  password!: string;

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

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  @HasMany(() => WatchHistory)
  watchHistory!: WatchHistory[];
}

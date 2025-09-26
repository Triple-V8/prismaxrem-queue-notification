import { Model } from 'sequelize';
declare class User extends Model {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}
export default User;
//# sourceMappingURL=User.d.ts.map
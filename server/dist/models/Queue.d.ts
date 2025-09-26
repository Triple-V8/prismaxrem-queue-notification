import { Model } from 'sequelize';
declare class Queue extends Model {
    id: number;
    userId: number;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
export default Queue;
//# sourceMappingURL=Queue.d.ts.map
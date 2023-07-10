import { DataTypes } from 'sequelize';
import { Reclient } from '../types';

export default {
    run: async (client: Reclient) => {
        client.sequelize.define('test', {
            key: DataTypes.STRING
        }, { timestamps: false });
        await client.sequelize.sync();
    }
}

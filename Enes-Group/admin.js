import { getUsersDatas ,updateUserInformation} from './database.js';

export async function usersDatas() {
   return await getUsersDatas();
}
export async function updateUserDatas(_id, authority, firstName, lastName, email, birthday) {
    return await updateUserInformation(_id, authority, firstName, lastName, email, birthday);
}
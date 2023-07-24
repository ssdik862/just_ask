import { unlink } from 'fs/promises';


export async function removeFile(path) {
    try {
        await unlink(path);
    } catch (error) {
        console.log('error ehen remove by unlink', error.message);
    }
}
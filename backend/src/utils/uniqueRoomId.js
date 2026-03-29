
export default function generateUniqueRoomIds(existingRooms){

    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let id = "";
    do {
        for(let i=0;i<7;i++){
            id+= chars.charAt(Math.floor(Math.random()*chars.length));
        }
    } while(existingRooms[id]);

    return id;
} 
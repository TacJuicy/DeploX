import fs from "fs";
import path from "path";

export const getAllFiles = (folderpath : string) => {
    let response: string[] = [];

    const allFilesandFolders = fs.readdirSync(folderpath);
    allFilesandFolders.forEach(file => {
        const fullFilePath = path.join(folderpath,file);
        if(fs.statSync(fullFilePath).isDirectory()){
            response= response.concat(getAllFiles(fullFilePath))
        }else{
            response.push(fullFilePath);
        }
    });
    return response;
}
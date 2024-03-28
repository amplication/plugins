export default function countParents(path: string): number {
    const pathParts = path.split('/');
    return pathParts.length - 1;
}

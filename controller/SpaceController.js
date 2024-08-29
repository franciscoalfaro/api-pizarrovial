import { exec } from 'child_process';
import os from 'os';

// Función para obtener la información del disco en Linux
const getDiskSpaceLinux = () => {
    return new Promise((resolve, reject) => {
        exec('df -BG --output=size,used,avail /', (error, stdout, stderr) => {
            if (error) {
                return reject('Error al obtener la información del disco');
            }

            if (stderr) {
                return reject(stderr);
            }

            // Parsear la salida del comando df
            const lines = stdout.trim().split('\n');
            const [header, data] = lines;
            const [size, used, avail] = data.trim().split(/\s+/);

            // Convertir los valores a números
            const totalSpaceGB = parseInt(size, 10);
            const usedSpaceGB = parseInt(used, 10);
            const freeSpaceGB = parseInt(avail, 10);

            // Redondear a los números más cercanos, por ejemplo, a múltiplos de 10
            const roundToNearest = (num, step = 10) => Math.round(num / step) * step;
            const realisticTotalGB = roundToNearest(totalSpaceGB);
            const realisticUsedGB = roundToNearest(usedSpaceGB);
            const realisticFreeGB = roundToNearest(freeSpaceGB);

            resolve({
                Total: realisticTotalGB,
                Usado: realisticUsedGB,
                Disponible: realisticFreeGB,
            });
        });
    });
};

// Función para obtener la información del disco en Windows
const getDiskSpaceWindows = () => {
    return new Promise((resolve, reject) => {
        exec('wmic logicaldisk get size,freespace,caption', (error, stdout, stderr) => {
            if (error) {
                return reject('Error al obtener la información del disco');
            }

            if (stderr) {
                return reject(stderr);
            }

            // Parsear la salida del comando wmic
            const lines = stdout.trim().split('\n').slice(1); // Ignorar el encabezado
            const [caption, freeSpace, size] = lines[0].trim().split(/\s+/);

            // Convertir los valores a GB
            const totalSpaceGB = Math.round(parseInt(size, 10) / (1024 * 1024 * 1024));
            const freeSpaceGB = Math.round(parseInt(freeSpace, 10) / (1024 * 1024 * 1024));
            const usedSpaceGB = totalSpaceGB - freeSpaceGB;

            // Redondear a los números más cercanos, por ejemplo, a múltiplos de 10
            const roundToNearest = (num, step = 10) => Math.round(num / step) * step;
            const realisticTotalGB = roundToNearest(totalSpaceGB);
            const realisticUsedGB = roundToNearest(usedSpaceGB);
            const realisticFreeGB = roundToNearest(freeSpaceGB);

            resolve({
                total: realisticTotalGB,
                used: realisticUsedGB,
                available: realisticFreeGB,
            });
        });
    });
};

// Función principal para obtener la información del disco
export const getDiskSpace = async (req, res) => {
    try {
        const platform = os.platform(); // Detecta el sistema operativo

        let diskUsage;

        if (platform === 'win32') {
            // Windows
            diskUsage = await getDiskSpaceWindows();
        } else if (platform === 'linux') {
            // Linux
            diskUsage = await getDiskSpaceLinux();
        } else {
            return res.status(500).json({ error: 'Sistema operativo no soportado' });
        }

        res.status(200).json({
            status: 'success',
            message: `Espacio en disco encontrado en ${platform}`,
            ...diskUsage,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

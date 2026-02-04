import express from "express";
import os from "os";
import si from "systeminformation";
import { catchAsync } from "#utils/catchAsync.js";

const router = express.Router();

const bytesToMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);
const bytesToGB = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);

// /api/health
router.get(
  "/",
  catchAsync(async (req, res) => {
    // Memory
    const totalMemMB = bytesToMB(os.totalmem());
    const freeMemMB = bytesToMB(os.freemem());
    const usedMemMB = (totalMemMB - freeMemMB).toFixed(2);
    const memUsagePercent = ((usedMemMB / totalMemMB) * 100).toFixed(2);

    // CPU
    const cpuLoad = await si.currentLoad();
    const cpuInfo = await si.cpu();

    // GPU
    let gpuInfo = [];
    try {
      gpuInfo = await si.graphics();
    } catch (err) {
      gpuInfo = { controllers: [] };
    }

    // Disk
    const diskInfo = await si.fsSize();
    const totalDiskGB = bytesToGB(diskInfo.reduce((acc, disk) => acc + disk.size, 0));
    const usedDiskGB = bytesToGB(diskInfo.reduce((acc, disk) => acc + disk.used, 0));
    const freeDiskGB = (totalDiskGB - usedDiskGB).toFixed(2);
    const diskUsagePercent = ((usedDiskGB / totalDiskGB) * 100).toFixed(2);

    // Network
    const networkInterfaces = await si.networkInterfaces();
    const networkStats = await si.networkStats();

    // OS Info
    const osInfo = await si.osInfo();

    // Process Info
    const processMemory = process.memoryUsage();
    const activeHandles = process._getActiveHandles().length;
    const eventLoopDelay = await si.services("node");

    const healthData = {
      status: "UP",
      uptime: process.uptime().toFixed(0) + "s",
      timestamp: new Date().toISOString(),
      memory: {
        totalMB: totalMemMB,
        freeMB: freeMemMB,
        usedMB: usedMemMB,
        usagePercent: memUsagePercent + "%",
      },
      cpu: {
        manufacturer: cpuInfo.manufacturer,
        brand: cpuInfo.brand,
        cores: cpuInfo.cores,
        physicalCores: cpuInfo.physicalCores,
        speedGHz: cpuInfo.speed,
        cacheSize: cpuInfo.cache.l1d + cpuInfo.cache.l1i + cpuInfo.cache.l2 + cpuInfo.cache.l3,
        loadPercent: cpuLoad.currentLoad.toFixed(2) + "%",
      },
      gpu: gpuInfo.controllers.map((gpu) => ({
        model: gpu.model,
        vendor: gpu.vendor,
        vramMB: gpu.vram,
        utilizationPercent: gpu.utilizationGpu
          ? gpu.utilizationGpu + "%"
          : "N/A",
      })),
      disk: {
        totalGB: totalDiskGB,
        usedGB: usedDiskGB,
        freeGB: freeDiskGB,
        usagePercent: diskUsagePercent + "%",
      },
      network: networkInterfaces.map((iface) => ({
        iface: iface.iface,
        ip4: iface.ip4,
        ip6: iface.ip6,
        mac: iface.mac,
        speed: iface.speed,
      })),
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
      },
      process: {
        memoryUsageMB: bytesToMB(processMemory.rss),
        activeHandles,
        eventLoopDelay: eventLoopDelay[0]?.cpu || "N/A",
      },
    };

    res.success({
      data: healthData,
      message: "Health check success",
    });
  })
);

export default router;

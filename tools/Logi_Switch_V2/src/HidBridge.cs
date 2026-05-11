using System;
using System.Collections.Generic;
using System.Threading;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace LogiEasySwitchSplit
{
    public class HidDeviceInfo
    {
        public string Path;
        public ushort VendorId;
        public ushort ProductId;
        public ushort UsagePage;
        public ushort Usage;
        public ushort OutputReportByteLength;
        public ushort InputReportByteLength;
        public ushort FeatureReportByteLength;
        public string VidPid { get { return VendorId.ToString("X4") + ":" + ProductId.ToString("X4"); } }
    }

    public class HidResult
    {
        public bool Ok;
        public string Message;
    }

    public class BulkHidResult
    {
        public int Total;
        public int Accepted;
        public int Failed;
        public string LastError;
    }

    public class PointInfo
    {
        public int X;
        public int Y;
    }

    public class VirtualScreenInfo
    {
        public int Left;
        public int Top;
        public int Width;
        public int Height;
        public int Right;
        public int Bottom;
    }

    public static class Cursor
    {
        [StructLayout(LayoutKind.Sequential)]
        private struct POINT
        {
            public int X;
            public int Y;
        }

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        private static extern int GetSystemMetrics(int nIndex);

        private const int SM_XVIRTUALSCREEN = 76;
        private const int SM_YVIRTUALSCREEN = 77;
        private const int SM_CXVIRTUALSCREEN = 78;
        private const int SM_CYVIRTUALSCREEN = 79;

        public static PointInfo GetPosition()
        {
            POINT p;
            if (!GetCursorPos(out p))
            {
                return new PointInfo { X = -1, Y = -1 };
            }

            return new PointInfo { X = p.X, Y = p.Y };
        }

        public static VirtualScreenInfo GetVirtualScreen()
        {
            int left = GetSystemMetrics(SM_XVIRTUALSCREEN);
            int top = GetSystemMetrics(SM_YVIRTUALSCREEN);
            int width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
            int height = GetSystemMetrics(SM_CYVIRTUALSCREEN);

            return new VirtualScreenInfo {
                Left = left,
                Top = top,
                Width = width,
                Height = height,
                Right = left + width - 1,
                Bottom = top + height - 1
            };
        }
    }

    public static class Hid
    {
        [StructLayout(LayoutKind.Sequential)]
        private struct SP_DEVICE_INTERFACE_DATA
        {
            public Int32 cbSize;
            public Guid interfaceClassGuid;
            public Int32 flags;
            public UIntPtr reserved;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private struct SP_DEVICE_INTERFACE_DETAIL_DATA
        {
            public Int32 cbSize;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 1024)]
            public string DevicePath;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HIDD_ATTRIBUTES
        {
            public Int32 Size;
            public UInt16 VendorID;
            public UInt16 ProductID;
            public UInt16 VersionNumber;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct HIDP_CAPS
        {
            public UInt16 Usage;
            public UInt16 UsagePage;
            public UInt16 InputReportByteLength;
            public UInt16 OutputReportByteLength;
            public UInt16 FeatureReportByteLength;
            [MarshalAs(UnmanagedType.ByValArray, SizeConst = 17)]
            public UInt16[] Reserved;
            public UInt16 NumberLinkCollectionNodes;
            public UInt16 NumberInputButtonCaps;
            public UInt16 NumberInputValueCaps;
            public UInt16 NumberInputDataIndices;
            public UInt16 NumberOutputButtonCaps;
            public UInt16 NumberOutputValueCaps;
            public UInt16 NumberOutputDataIndices;
            public UInt16 NumberFeatureButtonCaps;
            public UInt16 NumberFeatureValueCaps;
            public UInt16 NumberFeatureDataIndices;
        }

        [DllImport("hid.dll")]
        private static extern void HidD_GetHidGuid(out Guid HidGuid);

        [DllImport("hid.dll", SetLastError=true)]
        private static extern bool HidD_GetAttributes(SafeFileHandle HidDeviceObject, ref HIDD_ATTRIBUTES Attributes);

        [DllImport("hid.dll", SetLastError=true)]
        private static extern bool HidD_GetPreparsedData(SafeFileHandle HidDeviceObject, out IntPtr PreparsedData);

        [DllImport("hid.dll", SetLastError=true)]
        private static extern bool HidD_FreePreparsedData(IntPtr PreparsedData);

        [DllImport("hid.dll", SetLastError=true)]
        private static extern int HidP_GetCaps(IntPtr PreparsedData, out HIDP_CAPS Capabilities);

        [DllImport("hid.dll", SetLastError=true)]
        private static extern bool HidD_SetOutputReport(SafeFileHandle HidDeviceObject, byte[] lpReportBuffer, int ReportBufferLength);

        [DllImport("setupapi.dll", SetLastError=true)]
        private static extern IntPtr SetupDiGetClassDevs(ref Guid ClassGuid, IntPtr Enumerator, IntPtr hwndParent, uint Flags);

        [DllImport("setupapi.dll", SetLastError=true)]
        private static extern bool SetupDiEnumDeviceInterfaces(IntPtr DeviceInfoSet, IntPtr DeviceInfoData, ref Guid InterfaceClassGuid, uint MemberIndex, ref SP_DEVICE_INTERFACE_DATA DeviceInterfaceData);

        [DllImport("setupapi.dll", SetLastError=true, CharSet = CharSet.Auto)]
        private static extern bool SetupDiGetDeviceInterfaceDetail(IntPtr DeviceInfoSet, ref SP_DEVICE_INTERFACE_DATA DeviceInterfaceData, IntPtr DeviceInterfaceDetailData, uint DeviceInterfaceDetailDataSize, out uint RequiredSize, IntPtr DeviceInfoData);

        [DllImport("setupapi.dll", SetLastError=true, CharSet = CharSet.Auto)]
        private static extern bool SetupDiGetDeviceInterfaceDetail(IntPtr DeviceInfoSet, ref SP_DEVICE_INTERFACE_DATA DeviceInterfaceData, ref SP_DEVICE_INTERFACE_DETAIL_DATA DeviceInterfaceDetailData, uint DeviceInterfaceDetailDataSize, out uint RequiredSize, IntPtr DeviceInfoData);

        [DllImport("setupapi.dll", SetLastError=true)]
        private static extern bool SetupDiDestroyDeviceInfoList(IntPtr DeviceInfoSet);

        [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Auto)]
        private static extern SafeFileHandle CreateFile(string lpFileName, uint dwDesiredAccess, uint dwShareMode, IntPtr lpSecurityAttributes, uint dwCreationDisposition, uint dwFlagsAndAttributes, IntPtr hTemplateFile);

        [DllImport("kernel32.dll", SetLastError=true)]
        private static extern bool WriteFile(SafeFileHandle hFile, byte[] lpBuffer, uint nNumberOfBytesToWrite, out uint lpNumberOfBytesWritten, IntPtr lpOverlapped);

        private const uint DIGCF_PRESENT = 0x00000002;
        private const uint DIGCF_DEVICEINTERFACE = 0x00000010;
        private const uint GENERIC_READ = 0x80000000;
        private const uint GENERIC_WRITE = 0x40000000;
        private const uint FILE_SHARE_READ = 0x00000001;
        private const uint FILE_SHARE_WRITE = 0x00000002;
        private const uint OPEN_EXISTING = 3;
        private const uint FILE_ATTRIBUTE_NORMAL = 0x00000080;

        public static List<HidDeviceInfo> ListLogitech()
        {
            List<HidDeviceInfo> result = new List<HidDeviceInfo>();
            Guid hidGuid;
            HidD_GetHidGuid(out hidGuid);

            IntPtr infoSet = SetupDiGetClassDevs(ref hidGuid, IntPtr.Zero, IntPtr.Zero, DIGCF_PRESENT | DIGCF_DEVICEINTERFACE);
            if (infoSet == IntPtr.Zero || infoSet.ToInt64() == -1) return result;

            try
            {
                uint index = 0;
                while (true)
                {
                    SP_DEVICE_INTERFACE_DATA iface = new SP_DEVICE_INTERFACE_DATA();
                    iface.cbSize = Marshal.SizeOf(typeof(SP_DEVICE_INTERFACE_DATA));

                    if (!SetupDiEnumDeviceInterfaces(infoSet, IntPtr.Zero, ref hidGuid, index, ref iface))
                    {
                        break;
                    }

                    uint required = 0;
                    SetupDiGetDeviceInterfaceDetail(infoSet, ref iface, IntPtr.Zero, 0, out required, IntPtr.Zero);

                    SP_DEVICE_INTERFACE_DETAIL_DATA detail = new SP_DEVICE_INTERFACE_DETAIL_DATA();
                    detail.cbSize = IntPtr.Size == 8 ? 8 : 5;

                    if (SetupDiGetDeviceInterfaceDetail(infoSet, ref iface, ref detail, required, out required, IntPtr.Zero))
                    {
                        HidDeviceInfo dev = Probe(detail.DevicePath);
                        if (dev != null && dev.VendorId == 0x046D)
                        {
                            result.Add(dev);
                        }
                    }

                    index++;
                }
            }
            finally
            {
                SetupDiDestroyDeviceInfoList(infoSet);
            }

            return result;
        }

        private static HidDeviceInfo Probe(string path)
        {
            using (SafeFileHandle handle = CreateFile(path, GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero))
            {
                if (handle == null || handle.IsInvalid) return null;

                HIDD_ATTRIBUTES attrs = new HIDD_ATTRIBUTES();
                attrs.Size = Marshal.SizeOf(typeof(HIDD_ATTRIBUTES));
                if (!HidD_GetAttributes(handle, ref attrs)) return null;

                HIDP_CAPS caps = new HIDP_CAPS();
                IntPtr ppd;
                if (HidD_GetPreparsedData(handle, out ppd))
                {
                    try { HidP_GetCaps(ppd, out caps); }
                    finally { HidD_FreePreparsedData(ppd); }
                }

                return new HidDeviceInfo {
                    Path = path,
                    VendorId = attrs.VendorID,
                    ProductId = attrs.ProductID,
                    UsagePage = caps.UsagePage,
                    Usage = caps.Usage,
                    OutputReportByteLength = caps.OutputReportByteLength,
                    InputReportByteLength = caps.InputReportByteLength,
                    FeatureReportByteLength = caps.FeatureReportByteLength
                };
            }
        }

        public static HidResult SendSetOutputReport(string path, byte[] data)
        {
            using (SafeFileHandle handle = CreateFile(path, GENERIC_WRITE | GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero))
            {
                if (handle == null || handle.IsInvalid)
                    return new HidResult { Ok = false, Message = "open failed: " + Marshal.GetLastWin32Error().ToString() };

                bool ok = HidD_SetOutputReport(handle, data, data.Length);
                if (ok) return new HidResult { Ok = true, Message = "HidD_SetOutputReport accepted" };
                return new HidResult { Ok = false, Message = "HidD_SetOutputReport failed: " + Marshal.GetLastWin32Error().ToString() };
            }
        }

        public static HidResult SendWriteFile(string path, byte[] data)
        {
            using (SafeFileHandle handle = CreateFile(path, GENERIC_WRITE | GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero))
            {
                if (handle == null || handle.IsInvalid)
                    return new HidResult { Ok = false, Message = "open failed: " + Marshal.GetLastWin32Error().ToString() };

                uint written = 0;
                bool ok = WriteFile(handle, data, (uint)data.Length, out written, IntPtr.Zero);
                if (ok && written == data.Length)
                    return new HidResult { Ok = true, Message = "WriteFile accepted" };
                return new HidResult { Ok = false, Message = "WriteFile failed: " + Marshal.GetLastWin32Error().ToString() + " written=" + written.ToString() };
            }
        }
        public static BulkHidResult SendBulkReports(string path, byte[][] reports, bool useSetOutputReport, bool useWriteFile, int delayMilliseconds)
        {
            BulkHidResult summary = new BulkHidResult {
                Total = 0,
                Accepted = 0,
                Failed = 0,
                LastError = ""
            };

            using (SafeFileHandle handle = CreateFile(path, GENERIC_WRITE | GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, IntPtr.Zero, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, IntPtr.Zero))
            {
                if (handle == null || handle.IsInvalid)
                {
                    summary.LastError = "open failed: " + Marshal.GetLastWin32Error().ToString();
                    return summary;
                }

                foreach (byte[] data in reports)
                {
                    if (useSetOutputReport)
                    {
                        summary.Total++;
                        bool ok = HidD_SetOutputReport(handle, data, data.Length);
                        if (ok)
                        {
                            summary.Accepted++;
                        }
                        else
                        {
                            summary.Failed++;
                            summary.LastError = "HidD_SetOutputReport failed: " + Marshal.GetLastWin32Error().ToString();
                        }

                        if (delayMilliseconds > 0) Thread.Sleep(delayMilliseconds);
                    }

                    if (useWriteFile)
                    {
                        summary.Total++;
                        uint written = 0;
                        bool ok = WriteFile(handle, data, (uint)data.Length, out written, IntPtr.Zero);
                        if (ok && written == data.Length)
                        {
                            summary.Accepted++;
                        }
                        else
                        {
                            summary.Failed++;
                            summary.LastError = "WriteFile failed: " + Marshal.GetLastWin32Error().ToString() + " written=" + written.ToString();
                        }

                        if (delayMilliseconds > 0) Thread.Sleep(delayMilliseconds);
                    }
                }
            }

            return summary;
        }

    }
}

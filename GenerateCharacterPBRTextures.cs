using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class GenerateCharacterPBRTextures
{
    private static Random rnd = new Random(1954);

    public static void Main(string[] args)
    {
        Console.WriteLine("=== BẮT ĐẦU SẢN XUẤT VẬT LIỆU PBR & TEXTURES CHO 4 NHÂN VẬT 3D ===");

        string brainDir = @"C:\Users\TruongAn_PC\.gemini\antigravity\brain\1451e0cd-9142-44e6-baf2-d6986c894a92";
        string assetsTexturesDir = "assets/textures";
        string assetsCharactersDir = "assets/characters";

        Directory.CreateDirectory(assetsTexturesDir);
        Directory.CreateDirectory(assetsCharactersDir);

        // 1. Texture 1: Lụa gấm hoa văn cổ Hà Nội (Sapphire Blue Brocade) - char_nam_ao_dai_gam
        Console.WriteLine("\n[1/8] Xử lý Texture Lụa Gấm Xanh Lam Sapphire (char_silk_blue_brocade)...");
        string srcBrocade = Path.Combine(brainDir, "test_brocade_1793369355735.jpg");
        ProcessAndSaveTextureWithNormal(srcBrocade, "char_silk_blue_brocade", assetsTexturesDir, assetsCharactersDir, normalStrength: 1.8f);

        // 2. Texture 2: Vải lụa tơ tằm trắng ngà mềm mại (Ivory White Silk) - char_nu_sinh_ao_dai
        Console.WriteLine("\n[2/8] Xử lý Texture Vải Lụa Tơ Tằm Trắng Ngà (char_silk_ivory_white)...");
        string srcSilkWhite = Path.Combine(brainDir, "char_silk_ivory_white_1793369385438.jpg");
        ProcessAndSaveTextureWithNormal(srcSilkWhite, "char_silk_ivory_white", assetsTexturesDir, assetsCharactersDir, normalStrength: 1.5f);

        // 3. Texture 3: Vải đũi hồng cánh sen (Lotus Pink Silk/Cotton) - char_co_gai_ao_ba_ba
        Console.WriteLine("\n[3/8] Xử lý Texture Vải Đũi Hồng Cánh Sen (char_cotton_pink_lotus)...");
        string srcPinkFabric = Path.Combine(brainDir, "char_rose_fabric_1793369465628.jpg");
        ProcessAndSaveTextureWithNormal(srcPinkFabric, "char_cotton_pink_lotus", assetsTexturesDir, assetsCharactersDir, normalStrength: 2.2f);

        // 4. Texture 4: Khăn rằn caro đen trắng (Checkered Krama Scarf) - char_co_gai_ao_ba_ba
        Console.WriteLine("\n[4/8] Xử lý Texture Khăn Rằn Caro Đen Trắng (char_scarf_caro_krama)...");
        string srcScarf = Path.Combine(brainDir, "char_scarf_caro_krama_1793369488379.jpg");
        ProcessAndSaveTextureWithNormal(srcScarf, "char_scarf_caro_krama", assetsTexturesDir, assetsCharactersDir, normalStrength: 2.0f);

        // 5. Texture 5: Nan tre đan nón lá (Woven Bamboo Conical Hat)
        Console.WriteLine("\n[5/8] Xử lý Texture Nan Tre Đan Nón Lá (char_bamboo_non_la)...");
        string srcBamboo = Path.Combine(brainDir, "char_bamboo_non_la_1793369664181.jpg");
        ProcessAndSaveTextureWithNormal(srcBamboo, "char_bamboo_non_la", assetsTexturesDir, assetsCharactersDir, normalStrength: 2.5f);

        // 6. Texture 6: Vân da giày tây Oxford đen bóng (Polished Oxford Leather)
        Console.WriteLine("\n[6/8] Xử lý Texture Vân Da Giày Tây (char_leather_shoes_black)...");
        string srcLeather = Path.Combine(brainDir, "char_leather_shoes_black_1793369689873.jpg");
        ProcessAndSaveTextureWithNormal(srcLeather, "char_leather_shoes_black", assetsTexturesDir, assetsCharactersDir, normalStrength: 2.4f);

        // 7. Texture 7: Vải len dệt chìm màu xanh navy (Navy Wool Suiting Fabric) - char_nam_tri_thuc_suit
        Console.WriteLine("\n[7/8] Tạo Texture Vải Len Suit Xanh Navy (char_wool_navy_suit)...");
        GenerateNavyWoolSuit(assetsTexturesDir, assetsCharactersDir);

        // 8. Texture 8: Cà vạt lụa vintage đỏ mận / họa tiết cổ điển (Vintage Silk Tie) - char_nam_tri_thuc_suit
        Console.WriteLine("\n[8/8] Tạo Texture Cà Vạt Lụa Cổ Điển (char_silk_tie_vintage)...");
        GenerateVintageSilkTie(assetsTexturesDir, assetsCharactersDir);

        Console.WriteLine("\n=== HOÀN TẤT TOÀN BỘ 8 VẬT LIỆU TEXTURE PBR CHO 4 NHÂN VẬT 3D! ===");
    }

    private static ImageCodecInfo GetEncoder(ImageFormat format)
    {
        ImageCodecInfo[] codecs = ImageCodecInfo.GetImageDecoders();
        foreach (ImageCodecInfo codec in codecs)
        {
            if (codec.FormatID == format.Guid) return codec;
        }
        return null;
    }

    private static void SaveHighQualityJpeg(Bitmap bmp, string path, long quality = 95L)
    {
        ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
        Encoder myEncoder = Encoder.Quality;
        EncoderParameters myEncoderParameters = new EncoderParameters(1);
        EncoderParameter myEncoderParameter = new EncoderParameter(myEncoder, quality);
        myEncoderParameters.Param[0] = myEncoderParameter;
        bmp.Save(path, jpgEncoder, myEncoderParameters);
    }

    private static void ProcessAndSaveTextureWithNormal(string srcPath, string baseName, string dir1, string dir2, float normalStrength = 2.0f)
    {
        if (!File.Exists(srcPath))
        {
            Console.WriteLine("CẢNH BÁO: Không tìm thấy " + srcPath);
            return;
        }

        using (Bitmap srcBmp = new Bitmap(srcPath))
        {
            int targetW = 1024, targetH = 1024;
            using (Bitmap resBmp = new Bitmap(targetW, targetH, PixelFormat.Format24bppRgb))
            using (Graphics g = Graphics.FromImage(resBmp))
            {
                g.SmoothingMode = SmoothingMode.HighQuality;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.DrawImage(srcBmp, new Rectangle(0, 0, targetW, targetH));

                // Lưu Albedo Map vào cả dir1 và dir2
                string p1Jpg = Path.Combine(dir1, baseName + ".jpg");
                string p2Jpg = Path.Combine(dir2, baseName + ".jpg");
                SaveHighQualityJpeg(resBmp, p1Jpg, 95L);
                SaveHighQualityJpeg(resBmp, p2Jpg, 95L);
                Console.WriteLine("  + Đã lưu Albedo: " + p1Jpg + " & " + p2Jpg);

                // Tạo Normal Map
                using (Bitmap normBmp = GenerateNormalMap(resBmp, normalStrength))
                {
                    string n1Jpg = Path.Combine(dir1, baseName + "_norm.jpg");
                    string n2Jpg = Path.Combine(dir2, baseName + "_norm.jpg");
                    SaveHighQualityJpeg(normBmp, n1Jpg, 92L);
                    SaveHighQualityJpeg(normBmp, n2Jpg, 92L);
                    Console.WriteLine("  + Đã tạo Normal Map: " + n1Jpg + " & " + n2Jpg);
                }
            }
        }
    }

    private static Bitmap GenerateNormalMap(Bitmap albedo, float strength = 2.0f)
    {
        int w = albedo.Width;
        int h = albedo.Height;
        Bitmap norm = new Bitmap(w, h, PixelFormat.Format24bppRgb);

        // Lock bits for fast processing
        BitmapData srcData = albedo.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        BitmapData dstData = norm.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);

        int srcStride = srcData.Stride;
        int dstStride = dstData.Stride;

        unsafe
        {
            byte* srcPtr = (byte*)srcData.Scan0;
            byte* dstPtr = (byte*)dstData.Scan0;

            // Compute luminance height map
            float[,] height = new float[w, h];
            for (int y = 0; y < h; y++)
            {
                byte* row = srcPtr + (y * srcStride);
                for (int x = 0; x < w; x++)
                {
                    int b = row[x * 3];
                    int g = row[x * 3 + 1];
                    int r = row[x * 3 + 2];
                    height[x, y] = (0.299f * r + 0.587f * g + 0.114f * b) / 255.0f;
                }
            }

            // Sobel filter for normals
            for (int y = 0; y < h; y++)
            {
                byte* dstRow = dstPtr + (y * dstStride);
                int yPrev = (y - 1 + h) % h;
                int yNext = (y + 1) % h;

                for (int x = 0; x < w; x++)
                {
                    int xPrev = (x - 1 + w) % w;
                    int xNext = (x + 1) % w;

                    // Sobel X
                    float tl = height[xPrev, yPrev];
                    float l  = height[xPrev, y];
                    float bl = height[xPrev, yNext];
                    float tr = height[xNext, yPrev];
                    float r  = height[xNext, y];
                    float br = height[xNext, yNext];

                    // Sobel Y
                    float t  = height[x, yPrev];
                    float b  = height[x, yNext];

                    float dX = (tr + 2.0f * r + br) - (tl + 2.0f * l + bl);
                    float dY = (bl + 2.0f * b + br) - (tl + 2.0f * t + tr);

                    float nx = -dX * strength;
                    float ny = -dY * strength;
                    float nz = 1.0f;

                    float len = (float)Math.Sqrt(nx * nx + ny * ny + nz * nz);
                    nx /= len;
                    ny /= len;
                    nz /= len;

                    // Map [-1, 1] to [0, 255]
                    byte rOut = (byte)Math.Max(0, Math.Min(255, (int)((nx * 0.5f + 0.5f) * 255.0f)));
                    byte gOut = (byte)Math.Max(0, Math.Min(255, (int)((ny * 0.5f + 0.5f) * 255.0f)));
                    byte bOut = (byte)Math.Max(0, Math.Min(255, (int)((nz * 0.5f + 0.5f) * 255.0f)));

                    dstRow[x * 3]     = bOut; // Blue
                    dstRow[x * 3 + 1] = gOut; // Green
                    dstRow[x * 3 + 2] = rOut; // Red
                }
            }
        }

        albedo.UnlockBits(srcData);
        norm.UnlockBits(dstData);

        return norm;
    }

    // =========================================================================
    // 7. VẢI LEN SUIT XANH NAVY (1024 x 1024)
    // Vải dạ len dệt chìm twill / xương cá chìm màu xanh navy hoàng gia
    // =========================================================================
    public static void GenerateNavyWoolSuit(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        {
            BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
            int stride = data.Stride;

            unsafe
            {
                byte* ptr = (byte*)data.Scan0;

                // Base navy color: R=28, G=42, B=68 (0x1c2a44)
                for (int y = 0; y < h; y++)
                {
                    byte* row = ptr + (y * stride);
                    for (int x = 0; x < w; x++)
                    {
                        // Twill / fine weave pattern: 45-degree diagonal ribbed texture
                        int weave1 = ((x + y) / 2) % 4;
                        int weave2 = ((x - y + 10240) / 2) % 4;
                        float weaveShade = (weave1 == 0 || weave1 == 1) ? 1.08f : 0.94f;
                        if ((x % 3 == 0) && (y % 3 == 0)) weaveShade *= 1.05f;

                        // Subtle micro noise for wool fiber texture
                        int noise = rnd.Next(-7, 8);
                        int r = (int)(28 * weaveShade + noise);
                        int g = (int)(44 * weaveShade + noise * 1.2f);
                        int b = (int)(74 * weaveShade + noise * 1.4f);

                        // Subtle fabric fold sheen
                        double fold = Math.Sin(x * 0.008) * Math.Cos(y * 0.006) * 6.0;
                        r = (int)Math.Max(12, Math.Min(55, r + fold));
                        g = (int)Math.Max(22, Math.Min(75, g + fold * 1.1));
                        b = (int)Math.Max(42, Math.Min(110, b + fold * 1.3));

                        row[x * 3]     = (byte)b;
                        row[x * 3 + 1] = (byte)g;
                        row[x * 3 + 2] = (byte)r;
                    }
                }
            }

            bmp.UnlockBits(data);

            string p1 = Path.Combine(dir1, "char_wool_navy_suit.jpg");
            string p2 = Path.Combine(dir2, "char_wool_navy_suit.jpg");
            SaveHighQualityJpeg(bmp, p1, 95L);
            SaveHighQualityJpeg(bmp, p2, 95L);
            Console.WriteLine("  + Đã lưu Albedo: " + p1 + " & " + p2);

            using (Bitmap norm = GenerateNormalMap(bmp, 2.0f))
            {
                string n1 = Path.Combine(dir1, "char_wool_navy_suit_norm.jpg");
                string n2 = Path.Combine(dir2, "char_wool_navy_suit_norm.jpg");
                SaveHighQualityJpeg(norm, n1, 92L);
                SaveHighQualityJpeg(norm, n2, 92L);
                Console.WriteLine("  + Đã tạo Normal Map: " + n1 + " & " + n2);
            }
        }
    }

    // =========================================================================
    // 8. CÀ VẠT LỤA VINTAGE ĐỎ MẬN (1024 x 1024)
    // Lụa dệt jacquard viền chỉ vàng hoàng gia & họa tiết chấm chìm
    // =========================================================================
    public static void GenerateVintageSilkTie(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;

            // Nền đỏ mận đậm hoàng gia (Burgundy wine: #681525)
            using (SolidBrush bgBrush = new SolidBrush(Color.FromArgb(104, 21, 37)))
            {
                g.FillRectangle(bgBrush, 0, 0, w, h);
            }

            // Họa tiết lụa gấm dệt viền kim tuyến vàng đồng & xanh navy chìm
            int step = 32;
            using (Pen goldPen = new Pen(Color.FromArgb(120, 212, 175, 55), 1.5f))
            using (SolidBrush dotGold = new SolidBrush(Color.FromArgb(180, 235, 195, 75)))
            using (SolidBrush dotNavy = new SolidBrush(Color.FromArgb(140, 20, 35, 65)))
            {
                for (int y = 0; y < h + step; y += step)
                {
                    for (int x = 0; x < w + step; x += step)
                    {
                        int ox = (y / step) % 2 == 0 ? 0 : step / 2;
                        int cx = x + ox;
                        int cy = y;

                        // Kim cương nhỏ
                        Point[] diamond = new Point[] {
                            new Point(cx, cy - 8),
                            new Point(cx + 8, cy),
                            new Point(cx, cy + 8),
                            new Point(cx - 8, cy)
                        };
                        g.DrawPolygon(goldPen, diamond);
                        g.FillEllipse(dotGold, cx - 2, cy - 2, 4, 4);

                        // Chấm navy xen kẽ
                        g.FillEllipse(dotNavy, cx + step / 2 - 2, cy + step / 2 - 2, 4, 4);
                    }
                }
            }

            // Phủ thêm vân tơ dệt xiên chéo 45 độ
            using (Pen weavePen = new Pen(Color.FromArgb(22, 255, 255, 255), 1.0f))
            {
                for (int i = -w; i < w * 2; i += 4)
                {
                    g.DrawLine(weavePen, i, 0, i + h, h);
                }
            }

            string p1 = Path.Combine(dir1, "char_silk_tie_vintage.jpg");
            string p2 = Path.Combine(dir2, "char_silk_tie_vintage.jpg");
            SaveHighQualityJpeg(bmp, p1, 95L);
            SaveHighQualityJpeg(bmp, p2, 95L);
            Console.WriteLine("  + Đã lưu Albedo: " + p1 + " & " + p2);

            using (Bitmap norm = GenerateNormalMap(bmp, 1.8f))
            {
                string n1 = Path.Combine(dir1, "char_silk_tie_vintage_norm.jpg");
                string n2 = Path.Combine(dir2, "char_silk_tie_vintage_norm.jpg");
                SaveHighQualityJpeg(norm, n1, 92L);
                SaveHighQualityJpeg(norm, n2, 92L);
                Console.WriteLine("  + Đã tạo Normal Map: " + n1 + " & " + n2);
            }
        }
    }
}

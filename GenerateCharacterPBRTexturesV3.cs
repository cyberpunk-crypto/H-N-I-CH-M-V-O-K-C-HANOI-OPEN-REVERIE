using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class GenerateCharacterPBRTexturesV3
{
    private static Random rnd = new Random(1954);

    public static void Main(string[] args)
    {
        Console.WriteLine("=== BẮT ĐẦU NÂNG CẤP VẬT LIỆU PBR CHO 4 NHÂN VẬT (GAME_SPEC v3.1.0) ===");

        string assetsTexturesDir = "assets/textures";
        string assetsCharactersDir = "assets/characters";

        Directory.CreateDirectory(assetsTexturesDir);
        Directory.CreateDirectory(assetsCharactersDir);

        // 1. Chàng trai Thăng Long: Gấm xanh hoàng gia (0x16213e) có ánh kim vàng & Khăn xếp quấn nếp
        Console.WriteLine("\n[1/5] Tạo Texture Gấm Xanh Hoàng Gia 0x16213e Ánh Kim Vàng...");
        GenerateRoyalBlueGoldBrocade(assetsTexturesDir, assetsCharactersDir);
        GenerateTurbanBrocade(assetsTexturesDir, assetsCharactersDir);

        // 2. Nam trí thức: Vải dạ nỉ suit xám than/navy, sơ mi trắng, cravat cổ điển, giày da Oxford
        Console.WriteLine("\n[2/5] Tạo Texture Vải Dạ Nỉ Suit Xám Than / Navy & Sơ Mi Trắng...");
        GenerateCharcoalNavyWoolSuit(assetsTexturesDir, assetsCharactersDir);
        GenerateWhitePoplinShirt(assetsTexturesDir, assetsCharactersDir);

        // 3. Cô gái phố thị: Vải thô dệt hồng cánh sen cho Áo bà ba, quần đen, Khăn Rằn caro
        Console.WriteLine("\n[3/5] Nâng cấp Vải Thô Đũi Hồng Cánh Sen & Lụa Đen Quần...");
        GenerateRusticLotusPinkCloth(assetsTexturesDir, assetsCharactersDir);
        GenerateBlackSilkPants(assetsTexturesDir, assetsCharactersDir);

        // 4. Nữ sinh Tràng An: Lụa trắng tinh khôi cho Áo dài, Nón lá tre có quai vải lụa hồng
        Console.WriteLine("\n[4/5] Nâng cấp Lụa Trắng Tinh Khôi Áo Dài & Quai Lụa Hồng Nón Lá...");
        GeneratePureWhiteSilk(assetsTexturesDir, assetsCharactersDir);
        GeneratePinkSilkStrap(assetsTexturesDir, assetsCharactersDir);

        // 5. Đồng bộ hóa sang định dạng PNG & tạo aliases
        Console.WriteLine("\n[5/5] Đồng bộ hóa định dạng và tạo aliases...");
        SyncFormatsAndAliases(assetsTexturesDir, assetsCharactersDir);

        Console.WriteLine("\n=== HOÀN TẤT NÂNG CẤP TOÀN BỘ VẬT LIỆU PBR v3.1.0 THÀNH CÔNG! ===");
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

    private static Bitmap GenerateNormalMap(Bitmap albedo, float strength = 2.0f)
    {
        int w = albedo.Width;
        int h = albedo.Height;
        Bitmap norm = new Bitmap(w, h, PixelFormat.Format24bppRgb);

        BitmapData srcData = albedo.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
        BitmapData dstData = norm.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);

        int srcStride = srcData.Stride;
        int dstStride = dstData.Stride;

        unsafe
        {
            byte* srcPtr = (byte*)srcData.Scan0;
            byte* dstPtr = (byte*)dstData.Scan0;

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

            for (int y = 0; y < h; y++)
            {
                byte* dstRow = dstPtr + (y * dstStride);
                int yPrev = (y - 1 + h) % h;
                int yNext = (y + 1) % h;

                for (int x = 0; x < w; x++)
                {
                    int xPrev = (x - 1 + w) % w;
                    int xNext = (x + 1) % w;

                    float tl = height[xPrev, yPrev];
                    float l  = height[xPrev, y];
                    float bl = height[xPrev, yNext];
                    float tr = height[xNext, yPrev];
                    float r  = height[xNext, y];
                    float br = height[xNext, yNext];

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

                    byte rOut = (byte)Math.Max(0, Math.Min(255, (int)((nx * 0.5f + 0.5f) * 255.0f)));
                    byte gOut = (byte)Math.Max(0, Math.Min(255, (int)((ny * 0.5f + 0.5f) * 255.0f)));
                    byte bOut = (byte)Math.Max(0, Math.Min(255, (int)((nz * 0.5f + 0.5f) * 255.0f)));

                    dstRow[x * 3]     = bOut;
                    dstRow[x * 3 + 1] = gOut;
                    dstRow[x * 3 + 2] = rOut;
                }
            }
        }

        albedo.UnlockBits(srcData);
        norm.UnlockBits(dstData);

        return norm;
    }

    // =========================================================================
    // 1. GẤM XANH HOÀNG GIA (0x16213e) ÁNH KIM VÀNG - CHÀNG TRAI THĂNG LONG
    // =========================================================================
    public static void GenerateRoyalBlueGoldBrocade(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;

            // Nền xanh hoàng gia chuẩn 0x16213e: R=22, G=33, B=62
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(22, 33, 62)))
            {
                g.FillRectangle(bg, 0, 0, w, h);
            }

            // Dệt tơ tằm xiên 45 độ tạo ánh óng ả
            using (Pen weavePen = new Pen(Color.FromArgb(28, 60, 110, 180), 1f))
            {
                for (int i = -w; i < w * 2; i += 3)
                {
                    g.DrawLine(weavePen, i, 0, i + h, h);
                }
            }

            // Hoa văn mây rồng cung đình Thăng Long và cúc đại đóa dệt kim tuyến vàng
            int tile = 256;
            for (int ty = 0; ty < h; ty += tile)
            {
                for (int tx = 0; tx < w; tx += tile)
                {
                    DrawImperialCloudAndLotus(g, tx, ty, tile);
                }
            }

            // Lưu Albedo
            SaveBoth(bmp, "char_silk_blue_brocade.jpg", dir1, dir2);
            SaveBoth(bmp, "char_blue_brocade.jpg", dir1, dir2);

            // Tạo Normal Map sắc nét nổi bật sợi thêu vàng
            using (Bitmap norm = GenerateNormalMap(bmp, 2.2f))
            {
                SaveBoth(norm, "char_silk_blue_brocade_norm.jpg", dir1, dir2);
                SaveBoth(norm, "char_blue_brocade_norm.jpg", dir1, dir2);
            }
        }
    }

    private static void DrawImperialCloudAndLotus(Graphics g, int x, int y, int size)
    {
        int cx = x + size / 2;
        int cy = y + size / 2;

        // Vòng hoa cúc hoàng gia trung tâm
        using (Pen goldOutline = new Pen(Color.FromArgb(215, 218, 165, 32), 2.2f)) // #daa520
        using (SolidBrush goldFill = new SolidBrush(Color.FromArgb(90, 245, 200, 60)))
        using (Pen cyanAccent = new Pen(Color.FromArgb(180, 45, 212, 191), 1.5f)) // #2dd4bf
        {
            // Cánh hoa cúc cách điệu
            for (int angle = 0; angle < 360; angle += 30)
            {
                double rad = angle * Math.PI / 180.0;
                float px = cx + (float)(Math.Cos(rad) * 42.0);
                float py = cy + (float)(Math.Sin(rad) * 42.0);
                g.FillEllipse(goldFill, px - 10, py - 10, 20, 20);
                g.DrawEllipse(goldOutline, px - 10, py - 10, 20, 20);
            }

            // Nhụy hoa chữ Thọ cách điệu
            g.FillEllipse(goldFill, cx - 18, cy - 18, 36, 36);
            g.DrawEllipse(goldOutline, cx - 18, cy - 18, 36, 36);
            g.DrawEllipse(cyanAccent, cx - 12, cy - 12, 24, 24);

            // Dải mây lượn Thăng Long 4 góc
            DrawCloudWisps(g, goldOutline, cyanAccent, cx - 75, cy - 75);
            DrawCloudWisps(g, goldOutline, cyanAccent, cx + 75, cy - 75);
            DrawCloudWisps(g, goldOutline, cyanAccent, cx - 75, cy + 75);
            DrawCloudWisps(g, goldOutline, cyanAccent, cx + 75, cy + 75);
        }
    }

    private static void DrawCloudWisps(Graphics g, Pen gold, Pen cyan, float cx, float cy)
    {
        g.DrawArc(gold, cx - 25, cy - 15, 50, 30, 0, 180);
        g.DrawArc(cyan, cx - 15, cy - 10, 30, 20, 180, 180);
        g.DrawArc(gold, cx - 35, cy - 8, 30, 16, 220, 160);
        g.DrawArc(gold, cx + 5, cy - 8, 30, 16, 160, 160);
    }

    // =========================================================================
    // KHĂN XẾP QUẤN NẾP TRUYỀN THỐNG (char_turban_brocade)
    // =========================================================================
    public static void GenerateTurbanBrocade(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;

            // Nền xanh đen hoàng gia đậm (R=16, G=24, B=44)
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(16, 24, 44)))
            {
                g.FillRectangle(bg, 0, 0, w, h);
            }

            // Các nếp gấp quấn khăn xếp xếp tầng song song
            int pleatHeight = 32;
            for (int y = 0; y < h; y += pleatHeight)
            {
                using (LinearGradientBrush lgb = new LinearGradientBrush(
                    new Rectangle(0, y, w, pleatHeight),
                    Color.FromArgb(32, 48, 80),
                    Color.FromArgb(12, 18, 32),
                    LinearGradientMode.Vertical))
                {
                    g.FillRectangle(lgb, 0, y, w, pleatHeight);
                }

                // Đường gờ mép vải quấn
                using (Pen pleatEdge = new Pen(Color.FromArgb(140, 180, 140, 50), 1.2f))
                {
                    g.DrawLine(pleatEdge, 0, y, w, y);
                }
            }

            SaveBoth(bmp, "char_turban_brocade.jpg", dir1, dir2);
            using (Bitmap norm = GenerateNormalMap(bmp, 2.5f))
            {
                SaveBoth(norm, "char_turban_brocade_norm.jpg", dir1, dir2);
            }
        }
    }

    // =========================================================================
    // 2. VẢI DẠ NỈ SUIT XÁM THAN / NAVY - NAM TRÍ THỨC HÀ NỘI
    // =========================================================================
    public static void GenerateCharcoalNavyWoolSuit(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        {
            BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
            int stride = data.Stride;

            unsafe
            {
                byte* ptr = (byte*)data.Scan0;

                // Màu xám than pha navy (Charcoal Navy: R=32, G=38, B=50)
                for (int y = 0; y < h; y++)
                {
                    byte* row = ptr + (y * stride);
                    for (int x = 0; x < w; x++)
                    {
                        // Kiểu dệt xương cá Herringbone sắc nét
                        int chevronX = x % 32;
                        int dir = (x / 32) % 2 == 0 ? 1 : -1;
                        int weave = (dir * chevronX + y) % 4;

                        float weaveMul = (weave == 0 || weave == 1) ? 1.12f : 0.88f;

                        // Độ sần dạ nỉ mịn (Wool felt flannel grain)
                        int fuzz = rnd.Next(-8, 9);

                        int r = (int)(32 * weaveMul + fuzz);
                        int g = (int)(38 * weaveMul + fuzz);
                        int b = (int)(52 * weaveMul + fuzz * 1.2f);

                        // Draping gradient
                        double drape = Math.Sin(x * 0.006) * Math.Cos(y * 0.005) * 4.0;
                        r = (int)Math.Max(18, Math.Min(70, r + drape));
                        g = (int)Math.Max(22, Math.Min(78, g + drape));
                        b = (int)Math.Max(32, Math.Min(98, b + drape * 1.2));

                        row[x * 3]     = (byte)b;
                        row[x * 3 + 1] = (byte)g;
                        row[x * 3 + 2] = (byte)r;
                    }
                }
            }

            bmp.UnlockBits(data);

            SaveBoth(bmp, "char_wool_charcoal_suit.jpg", dir1, dir2);
            SaveBoth(bmp, "char_wool_navy_suit.jpg", dir1, dir2);
            SaveBoth(bmp, "char_navy_suit.jpg", dir1, dir2);

            using (Bitmap norm = GenerateNormalMap(bmp, 2.2f))
            {
                SaveBoth(norm, "char_wool_charcoal_suit_norm.jpg", dir1, dir2);
                SaveBoth(norm, "char_wool_navy_suit_norm.jpg", dir1, dir2);
                SaveBoth(norm, "char_navy_suit_norm.jpg", dir1, dir2);
            }
        }
    }

    // SƠ MI TRẮNG POPLIN CHO NAM TRÍ THỨC
    public static void GenerateWhitePoplinShirt(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        {
            BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
            int stride = data.Stride;

            unsafe
            {
                byte* ptr = (byte*)data.Scan0;
                for (int y = 0; y < h; y++)
                {
                    byte* row = ptr + (y * stride);
                    for (int x = 0; x < w; x++)
                    {
                        // Sợi poplin tinh khôi đan mịn
                        int grid = (x % 2 == 0 ^ y % 2 == 0) ? 2 : -2;
                        int baseVal = 248 + grid + rnd.Next(-2, 3);
                        baseVal = Math.Max(238, Math.Min(255, baseVal));

                        row[x * 3]     = (byte)baseVal;
                        row[x * 3 + 1] = (byte)baseVal;
                        row[x * 3 + 2] = (byte)baseVal;
                    }
                }
            }
            bmp.UnlockBits(data);

            SaveBoth(bmp, "char_shirt_white_cotton.jpg", dir1, dir2);
            using (Bitmap norm = GenerateNormalMap(bmp, 1.2f))
            {
                SaveBoth(norm, "char_shirt_white_cotton_norm.jpg", dir1, dir2);
            }
        }
    }

    // =========================================================================
    // 3. VẢI THÔ ĐŨI HỒNG CÁNH SEN - CÔ GÁI PHỐ THỊ ÁO BÀ BA
    // =========================================================================
    public static void GenerateRusticLotusPinkCloth(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        {
            BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
            int stride = data.Stride;

            unsafe
            {
                byte* ptr = (byte*)data.Scan0;

                // Hồng cánh sen truyền thống: R=223, G=100, B=138 (#df648a)
                for (int y = 0; y < h; y++)
                {
                    byte* row = ptr + (y * stride);
                    for (int x = 0; x < w; x++)
                    {
                        // Sợi thô đũi dệt chéo (Slub weave)
                        int slubX = (x / 4) % 3 == 0 ? 8 : -4;
                        int slubY = (y / 4) % 3 == 0 ? 8 : -4;
                        int noise = rnd.Next(-10, 11);

                        int r = (int)(223 + slubX + noise);
                        int g = (int)(100 + (slubX + slubY) / 2 + noise * 0.8f);
                        int b = (int)(138 + slubY + noise * 0.9f);

                        // Gradient nếp gấp vải đũi
                        double fold = Math.Sin(x * 0.007) * 6.0;
                        r = (int)Math.Max(180, Math.Min(245, r + fold));
                        g = (int)Math.Max(70, Math.Min(140, g + fold * 0.5));
                        b = (int)Math.Max(100, Math.Min(175, b + fold * 0.7));

                        row[x * 3]     = (byte)b;
                        row[x * 3 + 1] = (byte)g;
                        row[x * 3 + 2] = (byte)r;
                    }
                }
            }

            bmp.UnlockBits(data);

            SaveBoth(bmp, "char_cotton_pink_lotus.jpg", dir1, dir2);
            SaveBoth(bmp, "char_pink_ba_ba.jpg", dir1, dir2);

            using (Bitmap norm = GenerateNormalMap(bmp, 2.4f))
            {
                SaveBoth(norm, "char_cotton_pink_lotus_norm.jpg", dir1, dir2);
                SaveBoth(norm, "char_pink_ba_ba_norm.jpg", dir1, dir2);
            }
        }
    }

    // QUẦN LỤA ĐEN BÓNG MỜ CHO CÔ GÁI PHỐ THỊ
    public static void GenerateBlackSilkPants(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        {
            BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);
            int stride = data.Stride;

            unsafe
            {
                byte* ptr = (byte*)data.Scan0;
                for (int y = 0; y < h; y++)
                {
                    byte* row = ptr + (y * stride);
                    for (int x = 0; x < w; x++)
                    {
                        // Sợi tơ dệt mịn màu đen tuyền (#161618)
                        int weave = (x + y) % 2 == 0 ? 2 : -2;
                        int noise = rnd.Next(-3, 4);
                        int val = Math.Max(12, Math.Min(35, 22 + weave + noise));

                        row[x * 3]     = (byte)(val + 2); // hơi ánh xanh đen
                        row[x * 3 + 1] = (byte)val;
                        row[x * 3 + 2] = (byte)val;
                    }
                }
            }
            bmp.UnlockBits(data);

            SaveBoth(bmp, "char_silk_black_pants.jpg", dir1, dir2);
            using (Bitmap norm = GenerateNormalMap(bmp, 1.5f))
            {
                SaveBoth(norm, "char_silk_black_pants_norm.jpg", dir1, dir2);
            }
        }
    }

    // =========================================================================
    // 4. LỤA TRẮNG TINH KHÔI & QUAI LỤA HỒNG NÓN LÁ - NỮ SINH TRÀNG AN
    // =========================================================================
    public static void GeneratePureWhiteSilk(string dir1, string dir2)
    {
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;

            // Nền trắng ngọc trai tinh khôi (#fdfefe)
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(253, 254, 254)))
            {
                g.FillRectangle(bg, 0, 0, w, h);
            }

            // Hoa văn hoa sen Vạn Phúc dệt chìm óng ả
            using (Pen damaskPen = new Pen(Color.FromArgb(35, 230, 235, 245), 1.5f))
            using (SolidBrush damaskFill = new SolidBrush(Color.FromArgb(22, 240, 242, 250)))
            {
                int step = 128;
                for (int y = 0; y < h + step; y += step)
                {
                    for (int x = 0; x < w + step; x += step)
                    {
                        int ox = (y / step) % 2 == 0 ? 0 : step / 2;
                        int cx = x + ox;
                        int cy = y;

                        // Cánh sen nở e ấp
                        g.FillEllipse(damaskFill, cx - 20, cy - 30, 40, 60);
                        g.DrawEllipse(damaskPen, cx - 20, cy - 30, 40, 60);

                        g.FillEllipse(damaskFill, cx - 35, cy - 20, 70, 40);
                        g.DrawEllipse(damaskPen, cx - 35, cy - 20, 70, 40);
                    }
                }
            }

            // Gân dệt xiên chéo siêu mịn
            using (Pen threadPen = new Pen(Color.FromArgb(12, 210, 215, 225), 1.0f))
            {
                for (int i = -w; i < w * 2; i += 3)
                {
                    g.DrawLine(threadPen, i, 0, i + h, h);
                }
            }

            SaveBoth(bmp, "char_silk_ivory_white.jpg", dir1, dir2);
            SaveBoth(bmp, "char_white_silk.jpg", dir1, dir2);

            using (Bitmap norm = GenerateNormalMap(bmp, 1.6f))
            {
                SaveBoth(norm, "char_silk_ivory_white_norm.jpg", dir1, dir2);
                SaveBoth(norm, "char_white_silk_norm.jpg", dir1, dir2);
            }
        }
    }

    // QUAI NÓN LÁ LỤA HỒNG CÁNH SEN
    public static void GeneratePinkSilkStrap(string dir1, string dir2)
    {
        int w = 512, h = 512;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;

            // Màu lụa hồng sen e ấp dịu dàng (#de6f8c)
            using (SolidBrush bg = new SolidBrush(Color.FromArgb(222, 111, 140)))
            {
                g.FillRectangle(bg, 0, 0, w, h);
            }

            using (Pen weavePen = new Pen(Color.FromArgb(30, 255, 220, 235), 1.2f))
            {
                for (int i = 0; i < w * 2; i += 4)
                {
                    g.DrawLine(weavePen, 0, i, i, 0);
                }
            }

            SaveBoth(bmp, "char_silk_pink_strap.jpg", dir1, dir2);
            using (Bitmap norm = GenerateNormalMap(bmp, 1.5f))
            {
                SaveBoth(norm, "char_silk_pink_strap_norm.jpg", dir1, dir2);
            }
        }
    }

    private static void SaveBoth(Bitmap bmp, string fileName, string dir1, string dir2)
    {
        string p1 = Path.Combine(dir1, fileName);
        string p2 = Path.Combine(dir2, fileName);
        SaveHighQualityJpeg(bmp, p1, 95L);
        SaveHighQualityJpeg(bmp, p2, 95L);
        Console.WriteLine("  -> Đã tạo: " + fileName);
    }

    private static void SyncFormatsAndAliases(string dir1, string dir2)
    {
        foreach (string d in new string[] { dir1, dir2 })
        {
            string[] jpgs = Directory.GetFiles(d, "char_*.jpg");
            foreach (string j in jpgs)
            {
                string png = Path.ChangeExtension(j, ".png");
                if (!File.Exists(png))
                {
                    using (Image img = Image.FromFile(j))
                    {
                        img.Save(png, ImageFormat.Png);
                    }
                }
            }
        }
    }
}

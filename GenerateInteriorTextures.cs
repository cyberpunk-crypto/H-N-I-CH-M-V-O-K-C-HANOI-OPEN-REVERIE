using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class GenerateInteriorTextures
{
    private static Random rnd = new Random(1986);

    public static void Main(string[] args)
    {
        Console.WriteLine("=== BẮT ĐẦU SẢN XUẤT 6 TEXTURE NỘI THẤT & DỐC CẦU PBR ===");

        Directory.CreateDirectory("assets/textures");

        GenerateBridgeRampStone();
        GenerateWoodCounterVarnish();
        GenerateIndochineRug();
        GenerateRangDongThermos();
        GenerateBatTrangCeramic();
        GenerateSovietPoster();

        Console.WriteLine("=== HOÀN TẤT TOÀN BỘ 6 TEXTURE CHẤT LƯỢNG CAO! ===");
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

    private static void SaveHighQualityJpeg(Bitmap bmp, string path, long quality = 96L)
    {
        ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
        Encoder myEncoder = Encoder.Quality;
        EncoderParameters myEncoderParameters = new EncoderParameters(1);
        EncoderParameter myEncoderParameter = new EncoderParameter(myEncoder, quality);
        myEncoderParameters.Param[0] = myEncoderParameter;
        bmp.Save(path, jpgEncoder, myEncoderParameters);
    }

    // =========================================================================
    // 1. BRIDGE RAMP STONE (1024 x 1024)
    // Bề mặt bê tông đá dăm khía rãnh chống trượt dốc dẫn Cầu Long Biên
    // =========================================================================
    public static void GenerateBridgeRampStone()
    {
        Console.WriteLine("-> Đang tạo assets/textures/bridge_ramp_stone.jpg...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            // Nền bê tông xám đá dăm
            using (SolidBrush bBase = new SolidBrush(Color.FromArgb(98, 94, 88)))
            {
                g.FillRectangle(bBase, 0, 0, w, h);
            }

            // Hàng nghìn hạt đá dăm, sỏi nhỏ, cát xám đen
            for (int i = 0; i < 6000; i++)
            {
                int gx = rnd.Next(w);
                int gy = rnd.Next(h);
                int gsz = rnd.Next(2, 9);
                int lum = rnd.Next(40, 160);
                int a = rnd.Next(40, 120);
                using (SolidBrush bGrain = new SolidBrush(Color.FromArgb(a, lum, (int)(lum * 0.96), (int)(lum * 0.9))))
                {
                    g.FillEllipse(bGrain, gx, gy, gsz, gsz);
                }
            }

            // Rãnh khía chống trượt chéo hình xương cá / kim cương (Grooved Herringbone Pattern)
            int grooveSpacing = 36;
            for (int y = -w; y < h + w; y += grooveSpacing)
            {
                // Rãnh chéo xuôi 45 độ
                using (Pen pShadow = new Pen(Color.FromArgb(180, 24, 22, 20), 4.5f))
                using (Pen pGroove = new Pen(Color.FromArgb(240, 48, 45, 42), 3.0f))
                using (Pen pHighlight = new Pen(Color.FromArgb(150, 165, 160, 150), 1.8f))
                {
                    g.DrawLine(pShadow, 0, y + 2, w, y + w + 2);
                    g.DrawLine(pGroove, 0, y, w, y + w);
                    g.DrawLine(pHighlight, 0, y - 2, w, y + w - 2);
                }

                // Rãnh chéo ngược 45 độ tạo lưới mắt cáo chống trượt bánh xe dốc cầu
                using (Pen pShadow2 = new Pen(Color.FromArgb(160, 24, 22, 20), 4.0f))
                using (Pen pGroove2 = new Pen(Color.FromArgb(220, 52, 48, 45), 2.8f))
                using (Pen pHi2 = new Pen(Color.FromArgb(140, 160, 155, 145), 1.5f))
                {
                    g.DrawLine(pShadow2, 0, y + w + 2, w, y + 2);
                    g.DrawLine(pGroove2, 0, y + w, w, y);
                    g.DrawLine(pHi2, 0, y + w - 2, w, y - 2);
                }
            }

            // Đốm rêu xanh và vệt ẩm bám trong các kẽ rãnh bê tông cổ kính
            for (int m = 0; m < 1500; m++)
            {
                int mx = rnd.Next(w);
                int my = rnd.Next(h);
                int msz = rnd.Next(4, 28);
                int ma = rnd.Next(20, 75);
                int mg = rnd.Next(65, 110);
                int mr = (int)(mg * 0.6);
                int mb = (int)(mg * 0.45);
                using (SolidBrush bMoss = new SolidBrush(Color.FromArgb(ma, mr, mg, mb)))
                {
                    g.FillEllipse(bMoss, mx, my, msz, msz);
                }
            }

            // Vết nứt bê tông dốc cầu
            for (int c = 0; c < 12; c++)
            {
                int cx = rnd.Next(w);
                int cy = rnd.Next(h);
                PointF[] crackPts = new PointF[6];
                crackPts[0] = new PointF(cx, cy);
                for (int pt = 1; pt < 6; pt++)
                {
                    cx += rnd.Next(-30, 30);
                    cy += rnd.Next(10, 45);
                    crackPts[pt] = new PointF(cx, cy);
                }
                using (Pen pCrack = new Pen(Color.FromArgb(180, 20, 18, 16), 1.8f))
                {
                    g.DrawCurve(pCrack, crackPts);
                }
            }

            SaveHighQualityJpeg(bmp, "assets/textures/bridge_ramp_stone.jpg", 96L);
        }
        Console.WriteLine("-> Đã tạo xong: assets/textures/bridge_ramp_stone.jpg");
    }

    // =========================================================================
    // 2. WOOD_COUNTER_VARNISH (1024 x 1024)
    // Mặt gỗ lim quầy bar cà phê đánh vec-ni cánh gián bóng loáng viền nẹp đồng
    // =========================================================================
    public static void GenerateWoodCounterVarnish()
    {
        Console.WriteLine("-> Đang tạo assets/textures/wood_counter_varnish.jpg...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            // Nền gỗ lim nâu đỏ cánh gián sâu thẳm
            Rectangle rectAll = new Rectangle(0, 0, w, h);
            using (LinearGradientBrush bWoodBg = new LinearGradientBrush(rectAll, Color.FromArgb(75, 26, 12), Color.FromArgb(42, 14, 6), LinearGradientMode.Vertical))
            {
                g.FillRectangle(bWoodBg, rectAll);
            }

            // Các dải thớ gỗ lim uốn lượn (Wood grain flow)
            for (int y = 0; y < h; y += 4)
            {
                double wave = Math.Sin(y * 0.015) * 45 + Math.Sin(y * 0.04) * 20;
                int rCol = Math.Min(255, 75 + (int)(Math.Sin(y * 0.05) * 35));
                int gCol = Math.Max(0, (int)(rCol * 0.38));
                int bCol = Math.Max(0, (int)(rCol * 0.18));
                int alpha = rnd.Next(40, 110);

                using (Pen pGrain = new Pen(Color.FromArgb(alpha, rCol, gCol, bCol), rnd.Next(2, 6)))
                {
                    PointF[] gPts = new PointF[] {
                        new PointF(0, y),
                        new PointF((float)(w * 0.3), (float)(y + wave * 0.6)),
                        new PointF((float)(w * 0.7), (float)(y - wave * 0.4)),
                        new PointF(w, y + (float)wave)
                    };
                    g.DrawCurve(pGrain, gPts);
                }
            }

            // Vòng mắt gỗ lim tự nhiên (Wood knots)
            int[] knotXs = new int[] { 320, 780 };
            int[] knotYs = new int[] { 380, 720 };
            for (int k = 0; k < knotXs.Length; k++)
            {
                int kx = knotXs[k];
                int ky = knotYs[k];
                for (int rad = 90; rad >= 6; rad -= 6)
                {
                    int ka = 45 + (90 - rad);
                    using (Pen pKnot = new Pen(Color.FromArgb(ka, 32, 10, 4), 3.0f))
                    {
                        g.DrawEllipse(pKnot, kx - rad * 1.6f, ky - rad * 0.6f, rad * 3.2f, rad * 1.2f);
                    }
                }
            }

            // Lớp vec-ni bóng loáng (High-gloss varnish specular highlight)
            // Ánh sáng ấm 2700K phản chiếu mềm mại trên mặt quầy bar
            Rectangle rectSheen = new Rectangle(0, 120, w, 400);
            using (LinearGradientBrush bSheen = new LinearGradientBrush(
                rectSheen,
                Color.FromArgb(0, 255, 220, 160),
                Color.FromArgb(75, 255, 230, 180),
                LinearGradientMode.Vertical))
            {
                ColorBlend blend = new ColorBlend(3);
                blend.Colors = new Color[] { Color.FromArgb(0, 255, 220, 160), Color.FromArgb(65, 255, 230, 180), Color.FromArgb(0, 255, 220, 160) };
                blend.Positions = new float[] { 0.0f, 0.5f, 1.0f };
                bSheen.InterpolationColors = blend;
                g.FillRectangle(bSheen, 0, 0, w, h);
            }

            // Nẹp đồng thau viền cạnh quầy bar (Polished Brass Counter Trim)
            int trimH = 64;
            int trimY = h - trimH;
            Rectangle rectTrim = new Rectangle(0, trimY, w, trimH);

            // Bóng đổ dưới nẹp đồng
            using (SolidBrush bTrimShadow = new SolidBrush(Color.FromArgb(160, 15, 6, 2)))
            {
                g.FillRectangle(bTrimShadow, 0, trimY - 8, w, 10);
            }

            // Thân nẹp đồng vàng óng ánh
            using (LinearGradientBrush bBrass = new LinearGradientBrush(rectTrim, Color.FromArgb(245, 205, 95), Color.FromArgb(145, 105, 38), LinearGradientMode.Vertical))
            {
                g.FillRectangle(bBrass, rectTrim);
            }

            // Gờ highlight sáng kim loại trên nẹp đồng
            using (Pen pBrassHi = new Pen(Color.FromArgb(255, 245, 175), 2.5f))
            using (Pen pBrassLow = new Pen(Color.FromArgb(95, 68, 22), 2.0f))
            {
                g.DrawLine(pBrassHi, 0, trimY + 2, w, trimY + 2);
                g.DrawLine(pBrassLow, 0, h - 2, w, h - 2);
            }

            // Hàng đinh tán đồng đúc cổ điển dọc thân nẹp
            for (int rx = 40; rx < w; rx += 75)
            {
                Rectangle r = new Rectangle(rx - 8, trimY + 24, 16, 16);
                using (LinearGradientBrush bRivet = new LinearGradientBrush(r, Color.FromArgb(255, 240, 160), Color.FromArgb(120, 85, 25), LinearGradientMode.ForwardDiagonal))
                using (Pen pRivet = new Pen(Color.FromArgb(75, 50, 15), 1.5f))
                {
                    g.FillEllipse(bRivet, r);
                    g.DrawEllipse(pRivet, r);
                }
            }

            SaveHighQualityJpeg(bmp, "assets/textures/wood_counter_varnish.jpg", 96L);
        }
        Console.WriteLine("-> Đã tạo xong: assets/textures/wood_counter_varnish.jpg");
    }

    // =========================================================================
    // 3. INDOCHINE_RUG (1024 x 1024)
    // Họa tiết dệt hoa văn hình học thổ cẩm thảm trải sàn Đông Dương
    // =========================================================================
    public static void GenerateIndochineRug()
    {
        Console.WriteLine("-> Đang tạo assets/textures/indochine_rug.jpg...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            Color colBurgundy = Color.FromArgb(125, 28, 36);
            Color colNavy = Color.FromArgb(26, 48, 68);
            Color colGold = Color.FromArgb(212, 165, 58);
            Color colIvory = Color.FromArgb(242, 235, 215);
            Color colTeal = Color.FromArgb(42, 85, 72);

            // Nền thảm màu đỏ đô Đông Dương ấm cúng
            using (SolidBrush bBg = new SolidBrush(colBurgundy))
            {
                g.FillRectangle(bBg, 0, 0, w, h);
            }

            // Viền khung thảm ngoài (Outer Border)
            int border1 = 44;
            Rectangle rBorder1 = new Rectangle(border1, border1, w - border1 * 2, h - border1 * 2);
            using (SolidBrush bNavy = new SolidBrush(colNavy))
            using (Pen pGold = new Pen(colGold, 5))
            {
                g.FillRectangle(bNavy, rBorder1);
                g.DrawRectangle(pGold, rBorder1);
            }

            // Họa tiết hồi văn chữ Vạn / răng cưa viền thảm
            for (int x = border1 + 10; x < w - border1 - 20; x += 24)
            {
                using (SolidBrush bGold = new SolidBrush(colGold))
                {
                    // Viền trên & viền dưới
                    g.FillPolygon(bGold, new PointF[] { new PointF(x, border1 + 6), new PointF(x + 12, border1 + 24), new PointF(x - 12, border1 + 24) });
                    g.FillPolygon(bGold, new PointF[] { new PointF(x, h - border1 - 6), new PointF(x + 12, h - border1 - 24), new PointF(x - 12, h - border1 - 24) });
                }
            }

            // Khung thảm trong (Inner Field)
            int border2 = 88;
            Rectangle rBorder2 = new Rectangle(border2, border2, w - border2 * 2, h - border2 * 2);
            using (SolidBrush bBurg2 = new SolidBrush(Color.FromArgb(145, 32, 42)))
            using (Pen pIvory = new Pen(colIvory, 4))
            {
                g.FillRectangle(bBurg2, rBorder2);
                g.DrawRectangle(pIvory, rBorder2);
            }

            // Lưới hoa văn kỷ hà Đông Dương (Geometric diamond grid)
            int gridStep = 108;
            for (int gx = border2 + 54; gx < w - border2; gx += gridStep)
            {
                for (int gy = border2 + 54; gy < h - border2; gy += gridStep)
                {
                    // Quả trám kỷ hà
                    PointF[] diamond = new PointF[] {
                        new PointF(gx, gy - 42),
                        new PointF(gx + 42, gy),
                        new PointF(gx, gy + 42),
                        new PointF(gx - 42, gy)
                    };

                    using (SolidBrush bTeal = new SolidBrush(colTeal))
                    using (Pen pGoldD = new Pen(colGold, 2.5f))
                    {
                        g.FillPolygon(bTeal, diamond);
                        g.DrawPolygon(pGoldD, diamond);
                    }

                    // Hoa sen cách điệu ở tâm quả trám
                    using (SolidBrush bIv = new SolidBrush(colIvory))
                    {
                        g.FillEllipse(bIv, gx - 10, gy - 10, 20, 20);
                    }
                    using (SolidBrush bGoldC = new SolidBrush(colGold))
                    {
                        g.FillEllipse(bGoldC, gx - 5, gy - 5, 10, 10);
                    }
                }
            }

            // Hoa văn bông cúc trung tâm lớn (Central Medallion)
            int cx = w / 2, cy = h / 2;
            int medRadius = 140;
            using (SolidBrush bNavyMed = new SolidBrush(colNavy))
            using (Pen pGoldMed = new Pen(colGold, 6))
            {
                g.FillEllipse(bNavyMed, cx - medRadius, cy - medRadius, medRadius * 2, medRadius * 2);
                g.DrawEllipse(pGoldMed, cx - medRadius, cy - medRadius, medRadius * 2, medRadius * 2);
            }

            // 16 cánh hoa sen / hoa cúc tỏa ra từ tâm
            for (int petal = 0; petal < 16; petal++)
            {
                double rad = petal * Math.PI / 8.0;
                float px1 = (float)(cx + Math.Cos(rad) * 45);
                float py1 = (float)(cy + Math.Sin(rad) * 45);
                float px2 = (float)(cx + Math.Cos(rad) * 125);
                float py2 = (float)(cy + Math.Sin(rad) * 125);

                using (Pen pPetal = new Pen(colIvory, 8))
                {
                    pPetal.StartCap = LineCap.Round;
                    pPetal.EndCap = LineCap.Round;
                    g.DrawLine(pPetal, px1, py1, px2, py2);
                }
                using (Pen pPetalIn = new Pen(colGold, 4))
                {
                    pPetalIn.StartCap = LineCap.Round;
                    pPetalIn.EndCap = LineCap.Round;
                    g.DrawLine(pPetalIn, px1, py1, px2, py2);
                }
            }

            // Tâm huy hiệu
            using (SolidBrush bBurgC = new SolidBrush(colBurgundy))
            using (SolidBrush bGoldDot = new SolidBrush(colGold))
            {
                g.FillEllipse(bBurgC, cx - 35, cy - 35, 70, 70);
                g.FillEllipse(bGoldDot, cx - 18, cy - 18, 36, 36);
            }

            // Tua rua sợi len dệt ở 2 đầu thảm (Carpet fringes top & bottom)
            for (int fx = 12; fx < w - 12; fx += 8)
            {
                using (Pen pFringe = new Pen(colIvory, 2.5f))
                {
                    g.DrawLine(pFringe, fx, 0, fx + rnd.Next(-2, 3), border1 - 6);
                    g.DrawLine(pFringe, fx, h - border1 + 6, fx + rnd.Next(-2, 3), h);
                }
            }

            // Lớp vân dệt sợi vải thảm (Woven canvas texture)
            for (int tx = 0; tx < w; tx += 6)
            {
                using (Pen pWeave = new Pen(Color.FromArgb(25, 0, 0, 0), 1))
                {
                    g.DrawLine(pWeave, tx, 0, tx, h);
                }
            }
            for (int ty = 0; ty < h; ty += 6)
            {
                using (Pen pWeave = new Pen(Color.FromArgb(25, 0, 0, 0), 1))
                {
                    g.DrawLine(pWeave, 0, ty, w, ty);
                }
            }

            SaveHighQualityJpeg(bmp, "assets/textures/indochine_rug.jpg", 96L);
        }
        Console.WriteLine("-> Đã tạo xong: assets/textures/indochine_rug.jpg");
    }

    // =========================================================================
    // 4. RANG_DONG_THERMOS (512 x 512)
    // Vỏ nhôm in hoa cúc phích nước Rạng Đông và men sứ Hải Phòng
    // =========================================================================
    public static void GenerateRangDongThermos()
    {
        Console.WriteLine("-> Đang tạo assets/textures/rang_dong_thermos.jpg...");
        int w = 512, h = 512;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            // Nền sơn đỏ tươi phích Rạng Đông kinh điển
            Rectangle rectAll = new Rectangle(0, 0, w, h);
            using (LinearGradientBrush bRed = new LinearGradientBrush(rectAll, Color.FromArgb(225, 36, 40), Color.FromArgb(175, 20, 24), LinearGradientMode.Horizontal))
            {
                g.FillRectangle(bRed, rectAll);
            }

            // Ánh phản quang kim loại nhôm hình trụ (Cylinder aluminum sheen)
            using (LinearGradientBrush bSheen = new LinearGradientBrush(rectAll, Color.FromArgb(0, 255, 255, 255), Color.FromArgb(90, 255, 255, 255), LinearGradientMode.Horizontal))
            {
                ColorBlend blend = new ColorBlend(3);
                blend.Colors = new Color[] { Color.FromArgb(0, 255, 255, 255), Color.FromArgb(85, 255, 255, 255), Color.FromArgb(0, 255, 255, 255) };
                blend.Positions = new float[] { 0.0f, 0.45f, 1.0f };
                bSheen.InterpolationColors = blend;
                g.FillRectangle(bSheen, rectAll);
            }

            // Vành nhôm xước ánh bạc trên cổ và đáy phích
            int collarH = 42;
            Rectangle rTopCollar = new Rectangle(0, 0, w, collarH);
            Rectangle rBotCollar = new Rectangle(0, h - collarH, w, collarH);

            using (LinearGradientBrush bAlum = new LinearGradientBrush(rTopCollar, Color.FromArgb(220, 225, 230), Color.FromArgb(140, 145, 155), LinearGradientMode.Vertical))
            {
                g.FillRectangle(bAlum, rTopCollar);
                g.FillRectangle(bAlum, rBotCollar);
            }
            using (Pen pAlumEdge = new Pen(Color.FromArgb(80, 85, 95), 2))
            {
                g.DrawLine(pAlumEdge, 0, collarH, w, collarH);
                g.DrawLine(pAlumEdge, 0, h - collarH, w, h - collarH);
            }

            // Họa tiết hoa cúc đại đóa vẽ tay Rạng Đông (Golden Chrysanthemum)
            int flowerX = 256, flowerY = 250;

            // Lá cúc xanh ngọc uốn lượn
            PointF[][] leaves = new PointF[][] {
                new PointF[] { new PointF(180, 280), new PointF(110, 270), new PointF(80, 310), new PointF(130, 340), new PointF(190, 310) },
                new PointF[] { new PointF(330, 280), new PointF(400, 270), new PointF(430, 310), new PointF(380, 340), new PointF(320, 310) },
                new PointF[] { new PointF(220, 340), new PointF(190, 410), new PointF(240, 440), new PointF(270, 370) }
            };

            foreach (PointF[] leaf in leaves)
            {
                using (SolidBrush bLeaf = new SolidBrush(Color.FromArgb(42, 135, 68)))
                using (Pen pLeaf = new Pen(Color.FromArgb(25, 95, 45), 2))
                using (Pen pVein = new Pen(Color.FromArgb(120, 205, 145), 1.5f))
                {
                    g.FillPolygon(bLeaf, leaf);
                    g.DrawPolygon(pLeaf, leaf);
                    g.DrawLine(pVein, leaf[0].X, leaf[0].Y, leaf[2].X, leaf[2].Y);
                }
            }

            // Cành hoa cúc
            using (Pen pStem = new Pen(Color.FromArgb(32, 105, 52), 5))
            {
                g.DrawLine(pStem, flowerX, flowerY + 40, flowerX - 30, h - collarH - 10);
            }

            // Bông hoa cúc vàng rực nhiều lớp cánh
            for (int layer = 3; layer >= 1; layer--)
            {
                int numPetals = layer * 8;
                float rOuter = 26 + layer * 28;
                float rInner = 14 + layer * 10;
                Color colPetal = layer == 1 ? Color.FromArgb(255, 235, 75) : (layer == 2 ? Color.FromArgb(255, 195, 35) : Color.FromArgb(240, 145, 20));

                for (int p = 0; p < numPetals; p++)
                {
                    double ang = p * (2 * Math.PI / numPetals);
                    float px = (float)(flowerX + Math.Cos(ang) * rOuter);
                    float py = (float)(flowerY + Math.Sin(ang) * rOuter);
                    float bx = (float)(flowerX + Math.Cos(ang) * rInner);
                    float by = (float)(flowerY + Math.Sin(ang) * rInner);

                    using (Pen pPet = new Pen(colPetal, 7 - layer))
                    {
                        pPet.StartCap = LineCap.Round;
                        pPet.EndCap = LineCap.Round;
                        g.DrawLine(pPet, bx, by, px, py);
                    }
                }
            }

            // Nhụy hoa cúc cam đất ở giữa
            using (SolidBrush bCenter = new SolidBrush(Color.FromArgb(215, 85, 15)))
            using (SolidBrush bCenterHi = new SolidBrush(Color.FromArgb(255, 215, 45)))
            {
                g.FillEllipse(bCenter, flowerX - 18, flowerY - 18, 36, 36);
                g.FillEllipse(bCenterHi, flowerX - 9, flowerY - 9, 18, 18);
            }

            // Dòng chữ thương hiệu hoài niệm: "RẠNG ĐÔNG - HÀ NỘI"
            StringFormat sf = new StringFormat();
            sf.Alignment = StringAlignment.Center;
            sf.LineAlignment = StringAlignment.Center;

            using (Font fBrand = new Font("Arial", 20, FontStyle.Bold))
            using (SolidBrush bBrandShadow = new SolidBrush(Color.FromArgb(160, 20, 0, 0)))
            using (SolidBrush bBrandGold = new SolidBrush(Color.FromArgb(255, 235, 110)))
            {
                g.DrawString("RẠNG ĐÔNG", fBrand, bBrandShadow, 257, 102, sf);
                g.DrawString("RẠNG ĐÔNG", fBrand, bBrandGold, 256, 100, sf);
            }

            using (Font fSub = new Font("Arial", 11, FontStyle.Bold))
            using (SolidBrush bSub = new SolidBrush(Color.FromArgb(255, 245, 200)))
            {
                g.DrawString("HÀ NỘI ★ PHÍCH NƯỚC CAO CẤP", fSub, bSub, 256, 132, sf);
            }

            // Biểu tượng mặt trời mọc tỏa tia nắng
            using (SolidBrush bSun = new SolidBrush(Color.FromArgb(255, 220, 60)))
            {
                g.FillPie(bSun, 236, 52, 40, 40, 180, 180);
            }

            SaveHighQualityJpeg(bmp, "assets/textures/rang_dong_thermos.jpg", 96L);
        }
        Console.WriteLine("-> Đã tạo xong: assets/textures/rang_dong_thermos.jpg");
    }

    // =========================================================================
    // 5. BAT_TRANG_CERAMIC (512 x 512)
    // Men rạn gốm Bát Tràng cổ kính cắm hoa sen và bình trà
    // =========================================================================
    public static void GenerateBatTrangCeramic()
    {
        Console.WriteLine("-> Đang tạo assets/textures/bat_trang_ceramic.jpg...");
        int w = 512, h = 512;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            // Nền men ngọc tro trấu ngà lam (Celadon Ivory Glaze)
            Rectangle rectAll = new Rectangle(0, 0, w, h);
            using (LinearGradientBrush bCeladon = new LinearGradientBrush(rectAll, Color.FromArgb(232, 238, 234), Color.FromArgb(212, 224, 218), LinearGradientMode.ForwardDiagonal))
            {
                g.FillRectangle(bCeladon, rectAll);
            }

            // Mạng lưới rạn mai rùa Bát Tràng (Crackle Glaze network)
            // Hàng ngàn đường nứt rạn li ti vuốt mực chàm
            int numNodes = 75;
            PointF[] nodes = new PointF[numNodes];
            for (int i = 0; i < numNodes; i++)
            {
                nodes[i] = new PointF(rnd.Next(20, w - 20), rnd.Next(20, h - 20));
            }

            for (int i = 0; i < numNodes; i++)
            {
                for (int j = i + 1; j < numNodes; j++)
                {
                    double dist = Math.Sqrt(Math.Pow(nodes[i].X - nodes[j].X, 2) + Math.Pow(nodes[i].Y - nodes[j].Y, 2));
                    if (dist < 85)
                    {
                        int alpha = rnd.Next(70, 160);
                        using (Pen pCrack = new Pen(Color.FromArgb(alpha, 28, 48, 68), rnd.Next(1, 3)))
                        {
                            // Uốn cong nhẹ tự nhiên
                            float midX = (nodes[i].X + nodes[j].X) / 2 + rnd.Next(-6, 7);
                            float midY = (nodes[i].Y + nodes[j].Y) / 2 + rnd.Next(-6, 7);
                            g.DrawCurve(pCrack, new PointF[] { nodes[i], new PointF(midX, midY), nodes[j] });
                        }
                    }
                }
            }

            // Họa tiết vẽ tay Men Lam truyền thống Bát Tràng (Cobalt Blue Lotus)
            Color colCobalt = Color.FromArgb(220, 24, 48, 88);
            Color colCobaltLight = Color.FromArgb(170, 48, 85, 140);

            int lotusX = 256, lotusY = 270;

            // Lá sen xòe tròn men lam
            using (SolidBrush bLotusLeaf = new SolidBrush(Color.FromArgb(140, 32, 65, 110)))
            using (Pen pLeafBorder = new Pen(colCobalt, 2.5f))
            {
                g.FillEllipse(bLotusLeaf, 110, 330, 170, 100);
                g.DrawEllipse(pLeafBorder, 110, 330, 170, 100);

                // Gân lá sen
                for (int gAng = 0; gAng < 360; gAng += 45)
                {
                    double rad = gAng * Math.PI / 180.0;
                    g.DrawLine(pLeafBorder, 195, 380, (float)(195 + Math.Cos(rad) * 75), (float)(380 + Math.Sin(rad) * 42));
                }
            }

            // Nhành hoa sen nở rộ
            // Cánh hoa sen men lam mềm mại
            for (int petal = 0; petal < 7; petal++)
            {
                double pAng = (petal - 3) * 22;
                GraphicsState pState = g.Save();
                g.TranslateTransform(lotusX, lotusY);
                g.RotateTransform((float)pAng);

                using (GraphicsPath pLotus = new GraphicsPath())
                {
                    pLotus.AddBezier(0, 0, -22, -45, -16, -95, 0, -115);
                    pLotus.AddBezier(0, -115, 16, -95, 22, -45, 0, 0);

                    using (SolidBrush bPetal = new SolidBrush(Color.FromArgb(180, 35, 70, 125)))
                    using (Pen pPetal = new Pen(colCobalt, 2.2f))
                    {
                        g.FillPath(bPetal, pLotus);
                        g.DrawPath(pPetal, pLotus);
                    }
                }
                g.Restore(pState);
            }

            // Búp sen nhỏ bên cạnh
            using (SolidBrush bBud = new SolidBrush(colCobaltLight))
            using (Pen pBud = new Pen(colCobalt, 2))
            {
                g.FillEllipse(bBud, 330, 220, 38, 65);
                g.DrawEllipse(pBud, 330, 220, 38, 65);
            }
            using (Pen pStem = new Pen(colCobalt, 3))
            {
                g.DrawLine(pStem, 349, 285, 320, 420);
                g.DrawLine(pStem, lotusX, lotusY, 280, 450);
            }

            // Gợn sóng nước men lam ở đáy
            for (int wLine = 430; wLine < 490; wLine += 14)
            {
                using (Pen pWave = new Pen(colCobaltLight, 2.5f))
                {
                    PointF[] wPts = new PointF[] {
                        new PointF(20, wLine),
                        new PointF(140, wLine - 10),
                        new PointF(260, wLine + 8),
                        new PointF(380, wLine - 10),
                        new PointF(492, wLine)
                    };
                    g.DrawCurve(pWave, wPts);
                }
            }

            // Độ bóng thủy tinh men sứ (Ceramic specular sheen)
            using (LinearGradientBrush bGlaze = new LinearGradientBrush(rectAll, Color.FromArgb(70, 255, 255, 255), Color.FromArgb(0, 255, 255, 255), LinearGradientMode.ForwardDiagonal))
            {
                g.FillRectangle(bGlaze, rectAll);
            }

            SaveHighQualityJpeg(bmp, "assets/textures/bat_trang_ceramic.jpg", 96L);
        }
        Console.WriteLine("-> Đã tạo xong: assets/textures/bat_trang_ceramic.jpg");
    }

    // =========================================================================
    // 6. SOVIET_POSTER (1024 x 1024)
    // Áp phích cổ động mậu dịch thời bao cấp và bảng tem phiếu Hà Nội xưa
    // =========================================================================
    public static void GenerateSovietPoster()
    {
        Console.WriteLine("-> Đang tạo assets/textures/soviet_poster.jpg...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            StringFormat sfCenter = new StringFormat();
            sfCenter.Alignment = StringAlignment.Center;
            sfCenter.LineAlignment = StringAlignment.Center;

            // Nền tổng thể giấy bãi bằng vàng ố phong trần
            using (SolidBrush bPaper = new SolidBrush(Color.FromArgb(232, 218, 185)))
            {
                g.FillRectangle(bPaper, 0, 0, w, h);
            }

            // -----------------------------------------------------------------
            // NỬA TRÊN: ÁP PHÍCH CỔ ĐỘNG THỜI BAO CẤP (Y: 20 đến 490)
            // -----------------------------------------------------------------
            Rectangle rPostTop = new Rectangle(24, 24, w - 48, 470);
            using (SolidBrush bRedGov = new SolidBrush(Color.FromArgb(195, 32, 28)))
            using (Pen pGoldBorder = new Pen(Color.FromArgb(245, 210, 65), 6))
            {
                g.FillRectangle(bRedGov, rPostTop);
                g.DrawRectangle(pGoldBorder, rPostTop);
            }

            // Tia hào quang vàng rực tỏa ra từ ngôi sao lớn
            int starX = w / 2, starY = 160;
            for (int ray = 0; ray < 24; ray++)
            {
                double ang = ray * Math.PI / 12.0;
                float rx = (float)(starX + Math.Cos(ang) * 450);
                float ry = (float)(starY + Math.Sin(ang) * 450);
                using (Pen pRay = new Pen(Color.FromArgb(45, 255, 235, 120), 14))
                {
                    g.DrawLine(pRay, starX, starY, rx, ry);
                }
            }

            // Ngôi sao vàng năm cánh lớn biểu tượng cách mạng
            PointF[] starPts = new PointF[10];
            for (int s = 0; s < 10; s++)
            {
                double ang = s * Math.PI / 5.0 - Math.PI / 2.0;
                float r = (s % 2 == 0) ? 68 : 28;
                starPts[s] = new PointF((float)(starX + Math.Cos(ang) * r), (float)(starY + Math.Sin(ang) * r));
            }
            using (SolidBrush bStar = new SolidBrush(Color.FromArgb(255, 228, 55)))
            using (Pen pStarEdge = new Pen(Color.FromArgb(200, 160, 25), 2))
            {
                g.FillPolygon(bStar, starPts);
                g.DrawPolygon(pStarEdge, starPts);
            }

            // Bông lúa vàng óng và bánh răng công nghiệp ở 2 bên
            using (Pen pGear = new Pen(Color.FromArgb(255, 215, 65), 5))
            {
                g.DrawEllipse(pGear, starX - 110, starY + 20, 220, 100);
            }

            // Khẩu hiệu lớn: "THI ĐUA LAO ĐỘNG SẢN XUẤT"
            using (Font fTop1 = new Font("Impact", 44, FontStyle.Regular))
            using (SolidBrush bTopShadow = new SolidBrush(Color.FromArgb(200, 25, 10, 10)))
            using (SolidBrush bTopYellow = new SolidBrush(Color.FromArgb(255, 235, 65)))
            {
                g.DrawString("THI ĐUA LAO ĐỘNG SẢN XUẤT", fTop1, bTopShadow, starX + 3, 313, sfCenter);
                g.DrawString("THI ĐUA LAO ĐỘNG SẢN XUẤT", fTop1, bTopYellow, starX, 310, sfCenter);
            }

            // Khẩu hiệu dòng 2: "XÂY DỰNG VÀ BẢO VỆ THỦ ĐÔ GIÀU ĐẸP!"
            using (Font fTop2 = new Font("Arial", 22, FontStyle.Bold))
            using (SolidBrush bTopWhite = new SolidBrush(Color.FromArgb(255, 255, 240)))
            {
                g.DrawString("XÂY DỰNG VÀ BẢO VỆ THỦ ĐÔ HÀ NỘI NĂM 1986", fTop2, bTopWhite, starX, 390, sfCenter);
            }

            // -----------------------------------------------------------------
            // NỬA DƯỚI: BẢNG TEM PHIẾU PHÂN PHỐI MẬU DỊCH (Y: 510 đến 1000)
            // -----------------------------------------------------------------
            Rectangle rPostBot = new Rectangle(24, 514, w - 48, 485);
            using (SolidBrush bPaperSheet = new SolidBrush(Color.FromArgb(244, 232, 206)))
            using (Pen pPaperBorder = new Pen(Color.FromArgb(75, 55, 40), 4))
            {
                g.FillRectangle(bPaperSheet, rPostBot);
                g.DrawRectangle(pPaperBorder, rPostBot);
            }

            // Tiêu đề tem phiếu
            using (Font fRationTitle = new Font("Arial", 20, FontStyle.Bold))
            using (SolidBrush bTitleCol = new SolidBrush(Color.FromArgb(160, 25, 20)))
            {
                g.DrawString("CỬA HÀNG MẬU DỊCH QUỐC DOANH SỐ 12 - PHỐ CỔ HÀ NỘI", fRationTitle, bTitleCol, starX, 545, sfCenter);
            }

            using (Font fRationSub = new Font("Times New Roman", 16, FontStyle.Italic))
            using (SolidBrush bSubCol = new SolidBrush(Color.FromArgb(65, 50, 40)))
            {
                g.DrawString("PHIẾU CUNG CẤP LƯƠNG THỰC & NHU YẾU PHẨM - TIÊU CHUẨN CÁN BỘ CÔNG NHÂN VIÊN", fRationSub, bSubCol, starX, 582, sfCenter);
            }

            // Vẽ các ô tem phiếu phân phối (Ration coupons)
            string[][] coupons = new string[][] {
                new string[] { "TEM GẠO", "10 KG", "TIÊU CHUẨN THÁNG 10" },
                new string[] { "THỊT LỢN", "500 G", "THỰC PHẨM ĐỊNH LƯỢNG" },
                new string[] { "VẢI HOA", "2 MÉT", "HÀNG TIÊU DÙNG DỆT NAM ĐỊNH" },
                new string[] { "ĐƯỜNG KÍNH", "1 KG", "NHÀ MÁY ĐƯỜNG VẠN ĐIỂM" },
                new string[] { "DẦU HỎA", "2 LÍT", "CHẤT ĐỐT THẮP SÁNG & ĐUN NẤU" },
                new string[] { "BÁNH QUY", "1 HỘP", "HẢI CHÂU - CHẤT LƯỢNG CAO" }
            };

            int startY = 618;
            int boxW = 295;
            int boxH = 110;
            int gapX = 22;
            int gapY = 16;
            int startX = 48;

            for (int idx = 0; idx < coupons.Length; idx++)
            {
                int col = idx % 3;
                int row = idx / 3;
                int bx = startX + col * (boxW + gapX);
                int by = startY + row * (boxH + gapY);

                Rectangle rCoupon = new Rectangle(bx, by, boxW, boxH);
                using (SolidBrush bCoupBg = new SolidBrush(Color.FromArgb(252, 245, 228)))
                using (Pen pDash = new Pen(Color.FromArgb(120, 80, 60), 2))
                {
                    pDash.DashStyle = DashStyle.Dash;
                    g.FillRectangle(bCoupBg, rCoupon);
                    g.DrawRectangle(pDash, rCoupon);
                }

                // Tiêu đề ô tem
                using (Font fCoupName = new Font("Arial", 16, FontStyle.Bold))
                using (SolidBrush bCoupText = new SolidBrush(Color.FromArgb(175, 30, 25)))
                {
                    g.DrawString(coupons[idx][0], fCoupName, bCoupText, bx + boxW / 2, by + 26, sfCenter);
                }

                // Định lượng
                using (Font fQty = new Font("Impact", 24, FontStyle.Regular))
                using (SolidBrush bQty = new SolidBrush(Color.FromArgb(32, 28, 25)))
                {
                    g.DrawString(coupons[idx][1], fQty, bQty, bx + boxW / 2, by + 58, sfCenter);
                }

                // Ghi chú
                using (Font fNote = new Font("Arial", 10, FontStyle.Regular))
                using (SolidBrush bNote = new SolidBrush(Color.FromArgb(100, 75, 55)))
                {
                    g.DrawString(coupons[idx][2], fNote, bNote, bx + boxW / 2, by + 90, sfCenter);
                }
            }

            // Dấu mộc đỏ tròn "MẬU DỊCH QUỐC DOANH - ĐÃ THU"
            int stampX = 720, stampY = 880;
            using (Pen pStamp = new Pen(Color.FromArgb(190, 205, 35, 30), 4))
            {
                g.DrawEllipse(pStamp, stampX - 55, stampY - 55, 110, 110);
                g.DrawEllipse(pStamp, stampX - 44, stampY - 44, 88, 88);
            }
            using (Font fStamp = new Font("Arial", 11, FontStyle.Bold))
            using (SolidBrush bStampText = new SolidBrush(Color.FromArgb(190, 205, 35, 30)))
            {
                GraphicsState sState = g.Save();
                g.TranslateTransform(stampX, stampY);
                g.RotateTransform(-18);
                g.DrawString("MẬU DỊCH HÀ NỘI\n★ ĐÃ XÁC NHẬN ★\nNĂM 1986", fStamp, bStampText, 0, 0, sfCenter);
                g.Restore(sState);
            }

            // Hiệu ứng loang ố ố vàng thời gian
            for (int k = 0; k < 600; k++)
            {
                int gx = rnd.Next(w);
                int gy = rnd.Next(h);
                int gsz = rnd.Next(3, 35);
                int ga = rnd.Next(10, 50);
                using (SolidBrush bGrunge = new SolidBrush(Color.FromArgb(ga, 85, 55, 30)))
                {
                    g.FillEllipse(bGrunge, gx, gy, gsz, gsz);
                }
            }

            SaveHighQualityJpeg(bmp, "assets/textures/soviet_poster.jpg", 96L);
        }
        Console.WriteLine("-> Đã tạo xong: assets/textures/soviet_poster.jpg");
    }
}

using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class GenerateArtAssets
{
    private static Random rnd = new Random(2026);

    public static void Main(string[] args)
    {
        Console.WriteLine("=== BẮT ĐẦU TẠO TEXTURE AI & NGHỆ THUẬT SIÊU SẮC NÉT HÀ NỘI ===");

        Directory.CreateDirectory("assets/textures");

        GenerateGreenShutter();
        GenerateBalconyIron();
        GenerateBougainvillea();
        GenerateShopSigns();

        Console.WriteLine("=== HOÀN TẤT TẤT CẢ TEXTURE MỸ THUẬT XUẤT SẮC! ===");
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

    // =========================================================================
    // 1. HANOI GREEN SHUTTER (1024 x 1024)
    // Cửa chớp gỗ sơn xanh lá cây đặc trưng Pháp cổ Hà Nội
    // =========================================================================
    public static void GenerateGreenShutter()
    {
        Console.WriteLine("-> Đang vẽ assets/textures/hanoi_green_shutter.jpg...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            // Nền tường vàng Hà Nội rêu phong
            using (SolidBrush bWall = new SolidBrush(Color.FromArgb(215, 178, 92)))
            {
                g.FillRectangle(bWall, 0, 0, w, h);
            }

            // Vết loang ẩm rêu trên tường
            for (int i = 0; i < 2000; i++)
            {
                int nx = rnd.Next(w);
                int ny = rnd.Next(h);
                int nsz = rnd.Next(4, 40);
                int a = rnd.Next(15, 70);
                int gr = rnd.Next(70, 115);
                int red = rnd.Next(65, 110);
                int bl = rnd.Next(25, 55);
                using (SolidBrush bMoss = new SolidBrush(Color.FromArgb(a, red, gr, bl)))
                {
                    g.FillEllipse(bMoss, nx, ny, nsz, nsz);
                }
            }

            int framePad = 48;
            int frameW = w - framePad * 2;
            int frameH = h - framePad * 2;
            Rectangle rectFrame = new Rectangle(framePad, framePad, frameW, frameH);

            // Bóng đổ sâu từ tường vào hốc cửa
            using (Pen penDeep = new Pen(Color.FromArgb(190, 20, 18, 14), 16))
            {
                g.DrawRectangle(penDeep, framePad - 4, framePad - 4, frameW + 8, frameH + 8);
            }

            // Khung bao gỗ lim sẫm
            using (SolidBrush bWood = new SolidBrush(Color.FromArgb(58, 38, 24)))
            {
                g.FillRectangle(bWood, rectFrame);
            }

            // Gờ chỉ phào khung gỗ (Inner molding)
            int moldPad = 24;
            Rectangle rectMold = new Rectangle(framePad + moldPad, framePad + moldPad, frameW - moldPad * 2, frameH - moldPad * 2);
            using (Pen penMold = new Pen(Color.FromArgb(35, 24, 15), 6))
            {
                g.DrawRectangle(penMold, rectMold);
            }

            // Hai cánh cửa chớp (Double shutters)
            int doorGap = 6;
            int doorPad = 34;
            int totalShutterW = frameW - doorPad * 2;
            int shutterW = (totalShutterW - doorGap) / 2;
            int shutterH = frameH - doorPad * 2;
            int shutterTop = framePad + doorPad;

            Rectangle rectLeft = new Rectangle(framePad + doorPad, shutterTop, shutterW, shutterH);
            Rectangle rectRight = new Rectangle(framePad + doorPad + shutterW + doorGap, shutterTop, shutterW, shutterH);

            DrawSingleShutter(g, rectLeft, true);
            DrawSingleShutter(g, rectRight, false);

            // Bản lề sắt Pháp cổ
            int[] hingeYs = new int[] { shutterTop + 65, shutterTop + (int)(shutterH * 0.48), shutterTop + shutterH - 85 };
            foreach (int hy in hingeYs)
            {
                // Bản lề cánh trái
                using (SolidBrush bIron = new SolidBrush(Color.FromArgb(32, 35, 38)))
                {
                    g.FillRectangle(bIron, rectLeft.X - 6, hy, 40, 16);
                    g.FillRectangle(bIron, rectRight.X + rectRight.Width - 34, hy, 40, 16);
                }
                using (SolidBrush bRivet = new SolidBrush(Color.FromArgb(85, 65, 50)))
                {
                    g.FillEllipse(bRivet, rectLeft.X + 6, hy + 3, 10, 10);
                    g.FillEllipse(bRivet, rectLeft.X + 22, hy + 3, 10, 10);
                    g.FillEllipse(bRivet, rectRight.X + rectRight.Width - 30, hy + 3, 10, 10);
                    g.FillEllipse(bRivet, rectRight.X + rectRight.Width - 14, hy + 3, 10, 10);
                }
            }

            // Then cài chốt đồng thau cổ ở giữa 2 cánh cửa
            int latchY = shutterTop + (int)(shutterH * 0.52) - 16;
            int latchX = rectLeft.X + shutterW - 46;
            Rectangle rectLatch = new Rectangle(latchX, latchY, 98, 52);

            using (SolidBrush bBrass = new SolidBrush(Color.FromArgb(170, 130, 52)))
            {
                g.FillRectangle(bBrass, rectLatch);
            }
            // Vệt oxy hóa xanh rỉ đồng (Verdigris)
            using (SolidBrush bVerdigris = new SolidBrush(Color.FromArgb(130, 60, 135, 105)))
            {
                g.FillEllipse(bVerdigris, latchX + 8, latchY + 8, 32, 20);
                g.FillEllipse(bVerdigris, latchX + 52, latchY + 16, 36, 24);
            }

            // Then chốt ngang bằng đồng
            Rectangle rectBolt = new Rectangle(latchX - 10, latchY + 18, 118, 16);
            using (LinearGradientBrush gBolt = new LinearGradientBrush(rectBolt, Color.FromArgb(240, 200, 95), Color.FromArgb(135, 95, 35), LinearGradientMode.Vertical))
            {
                g.FillRectangle(gBolt, rectBolt);
            }

            // Núm đồng tròn
            using (SolidBrush bKnob = new SolidBrush(Color.FromArgb(245, 215, 110)))
            using (Pen pKnob = new Pen(Color.FromArgb(110, 80, 25), 2))
            {
                g.FillEllipse(bKnob, latchX + 41, latchY + 12, 28, 28);
                g.DrawEllipse(pKnob, latchX + 41, latchY + 12, 28, 28);
            }

            // Ốc vít đồng ở 4 góc
            using (SolidBrush bScrew = new SolidBrush(Color.FromArgb(110, 80, 30)))
            {
                g.FillEllipse(bScrew, latchX + 6, latchY + 6, 8, 8);
                g.FillEllipse(bScrew, latchX + 84, latchY + 6, 8, 8);
                g.FillEllipse(bScrew, latchX + 6, latchY + 38, 8, 8);
                g.FillEllipse(bScrew, latchX + 84, latchY + 38, 8, 8);
            }

            SaveHighQualityJpeg(bmp, "assets/textures/hanoi_green_shutter.jpg", 95L);
        }
        Console.WriteLine("-> Đã lưu xong: assets/textures/hanoi_green_shutter.jpg");
    }

    private static void DrawSingleShutter(Graphics g, Rectangle rect, bool isLeft)
    {
        Color colGreenBase = Color.FromArgb(42, 78, 54);
        Color colGreenDark = Color.FromArgb(25, 48, 34);
        Color colGreenLight = Color.FromArgb(62, 110, 78);
        Color colWoodBare = Color.FromArgb(145, 105, 68);
        Color colWoodDark = Color.FromArgb(85, 58, 36);

        // Khung cánh
        using (SolidBrush bBase = new SolidBrush(colGreenBase))
        using (Pen pStile = new Pen(colGreenDark, 3))
        {
            g.FillRectangle(bBase, rect);
            g.DrawRectangle(pStile, rect);
        }

        int stileW = 34;
        int railH = 34;
        int midRailH = 38;
        int midRailY = rect.Y + (int)(rect.Height * 0.52);
        Rectangle rectMidRail = new Rectangle(rect.X, midRailY, rect.Width, midRailH);

        using (SolidBrush bMid = new SolidBrush(Color.FromArgb(36, 70, 48)))
        using (Pen pMid = new Pen(colGreenDark, 2))
        {
            g.FillRectangle(bMid, rectMidRail);
            g.DrawRectangle(pMid, rectMidRail);
        }

        // Louver sections (trên và dưới)
        int[][] sections = new int[][] {
            new int[] { rect.Y + railH + 6, midRailY - 6 },
            new int[] { midRailY + midRailH + 6, rect.Y + rect.Height - railH - 6 }
        };

        int innerX = rect.X + stileW + 4;
        int innerW = rect.Width - (stileW + 4) * 2;

        foreach (int[] sec in sections)
        {
            int secH = sec[1] - sec[0];
            int lStep = 18;
            int numLouvers = secH / lStep;

            for (int l = 0; l < numLouvers; l++)
            {
                int ly = sec[0] + l * lStep;
                int lh = 15;

                // Bóng đổ nan chớp
                using (SolidBrush bShadow = new SolidBrush(Color.FromArgb(130, 15, 25, 18)))
                {
                    g.FillRectangle(bShadow, innerX, ly + 7, innerW, 8);
                }

                // Thân nan chớp gradient xanh
                Rectangle rectLouver = new Rectangle(innerX, ly, innerW, lh);
                using (LinearGradientBrush gLouver = new LinearGradientBrush(rectLouver, colGreenLight, colGreenDark, LinearGradientMode.Vertical))
                {
                    g.FillRectangle(gLouver, rectLouver);
                }

                // Mép trên phản chiếu ánh sáng
                using (Pen pHi = new Pen(Color.FromArgb(95, 150, 108), 1.5f))
                {
                    g.DrawLine(pHi, innerX, ly, innerX + innerW, ly);
                }

                // Tróc sơn để lộ thớ gỗ mộc
                if (rnd.Next(100) < 38)
                {
                    int chipX = innerX + rnd.Next(10, innerW - 40);
                    int chipW = rnd.Next(16, 46);
                    int chipY = ly + rnd.Next(2, 6);
                    int chipH = rnd.Next(4, 8);

                    using (SolidBrush bBare = new SolidBrush(colWoodBare))
                    {
                        g.FillRectangle(bBare, chipX, chipY, chipW, chipH);
                    }
                    using (Pen pCrack = new Pen(colWoodDark, 1))
                    {
                        g.DrawLine(pCrack, chipX + 2, chipY + chipH / 2, chipX + chipW - 2, chipY + chipH / 2);
                    }
                }
            }
        }

        // Vết trầy tróc sơn dọc theo hai thanh đứng
        for (int k = 0; k < 35; k++)
        {
            int wx = rect.X + rnd.Next(2, stileW);
            if (rnd.Next(2) == 1) wx = rect.X + rect.Width - stileW + rnd.Next(2, stileW);
            int wy = rect.Y + rnd.Next(10, rect.Height - 60);
            int wh = rnd.Next(20, 80);

            using (SolidBrush bPeel = new SolidBrush(Color.FromArgb(170, 130, 92, 58)))
            {
                g.FillRectangle(bPeel, wx, wy, rnd.Next(3, 8), wh);
            }
        }
    }

    // =========================================================================
    // 2. FRENCH BALCONY IRON (1024 x 1024 PNG Trong Suốt)
    // Hoa văn lan can ban công sắt uốn nghệ thuật Art Deco / Art Nouveau
    // =========================================================================
    public static void GenerateBalconyIron()
    {
        Console.WriteLine("-> Đang vẽ assets/textures/french_balcony_iron.png...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            // Nền trong suốt 100%
            g.Clear(Color.FromArgb(0, 0, 0, 0));

            Color colIronMid = Color.FromArgb(255, 42, 45, 50);
            Color colIronLight = Color.FromArgb(255, 85, 90, 100);

            // Tay vịn trên cùng (Top Handrail)
            int topY = 90;
            Draw3DIronBar(g, 20, topY - 14, 1004, topY - 14, 22);
            Draw3DIronBar(g, 20, topY, 1004, topY, 16);
            Draw3DIronBar(g, 20, topY + 14, 1004, topY + 14, 12);

            // Xà dưới cùng (Bottom Rail)
            int botY = 930;
            Draw3DIronBar(g, 20, botY - 12, 1004, botY - 12, 14);
            Draw3DIronBar(g, 20, botY, 1004, botY, 22);
            Draw3DIronBar(g, 20, botY + 14, 1004, botY + 14, 12);

            // Xà phụ giữa
            int midY1 = 340;
            int midY2 = 680;
            Draw3DIronBar(g, 25, midY1, 999, midY1, 10);
            Draw3DIronBar(g, 25, midY2, 999, midY2, 10);

            // Cột trụ đứng kép chia 4 ô panel
            for (int col = 0; col <= 4; col++)
            {
                int postX = 32 + (col * (w - 64) / 4);
                Draw3DIronBar(g, postX - 5, topY - 18, postX - 5, botY + 18, 12);
                Draw3DIronBar(g, postX + 5, topY - 18, postX + 5, botY + 18, 12);

                // Đinh tán nổi 3D
                for (int ry = topY; ry <= botY; ry += 170)
                {
                    using (SolidBrush bRivet = new SolidBrush(Color.FromArgb(255, 68, 72, 82)))
                    using (Pen pRivet = new Pen(Color.FromArgb(255, 14, 16, 20), 2))
                    {
                        g.FillEllipse(bRivet, postX - 12, ry - 10, 24, 20);
                        g.DrawEllipse(pRivet, postX - 12, ry - 10, 24, 20);
                    }
                }
            }

            // Họa tiết trong từng ô panel
            for (int p = 0; p < 4; p++)
            {
                int pLeft = 32 + (p * (w - 64) / 4) + 16;
                int pRight = 32 + ((p + 1) * (w - 64) / 4) - 16;
                int pCenterX = (pLeft + pRight) / 2;

                // TẦNG TRÊN: Vòng tròn Art Deco & Nan tia
                int circleCenterY = (topY + midY1) / 2;
                int circleRadius = 55;
                using (Pen pCircle = new Pen(colIronMid, 8))
                using (Pen pCircleHi = new Pen(colIronLight, 2))
                {
                    g.DrawEllipse(pCircle, pCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2);
                    g.DrawEllipse(pCircleHi, pCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2);
                }
                using (Pen pInner = new Pen(colIronMid, 5))
                {
                    g.DrawEllipse(pInner, pCenterX - 28, circleCenterY - 28, 56, 56);
                }

                Draw3DIronBar(g, pCenterX - 85, circleCenterY, pCenterX - 55, circleCenterY, 7);
                Draw3DIronBar(g, pCenterX + 55, circleCenterY, pCenterX + 85, circleCenterY, 7);
                Draw3DIronBar(g, pCenterX, circleCenterY - 95, pCenterX, circleCenterY - 55, 7);
                Draw3DIronBar(g, pCenterX, circleCenterY + 55, pCenterX, circleCenterY + 95, 7);

                // TẦNG GIỮA: Cặp xoắn ốc Art Nouveau
                int midCenterY = (midY1 + midY2) / 2;
                DrawArtNouveauScroll(g, pCenterX - 36, midCenterY - 45, 58, 1, 1);
                DrawArtNouveauScroll(g, pCenterX + 36, midCenterY - 45, 58, -1, 1);
                DrawArtNouveauScroll(g, pCenterX - 36, midCenterY + 45, 58, 1, -1);
                DrawArtNouveauScroll(g, pCenterX + 36, midCenterY + 45, 58, -1, -1);

                Draw3DIronBar(g, pCenterX, midY1 + 10, pCenterX, midY2 - 10, 9);
                // Búp sen giữa
                PointF[] fleurPts = new PointF[] {
                    new PointF(pCenterX, midCenterY - 25),
                    new PointF(pCenterX - 18, midCenterY),
                    new PointF(pCenterX, midCenterY + 25),
                    new PointF(pCenterX + 18, midCenterY)
                };
                using (SolidBrush bFleur = new SolidBrush(colIronMid))
                {
                    g.FillPolygon(bFleur, fleurPts);
                }
                using (SolidBrush bClamp = new SolidBrush(Color.FromArgb(255, 62, 66, 75)))
                {
                    g.FillRectangle(bClamp, pCenterX - 14, midCenterY - 8, 28, 16);
                }

                // TẦNG DƯỚI: Nan rẻ quạt Art Deco
                for (double ang = -45; ang <= 45; ang += 22.5)
                {
                    double rad = ang * Math.PI / 180.0;
                    float fx = (float)(pCenterX + Math.Sin(rad) * 105);
                    float fy = (float)(botY - 15 - Math.Cos(rad) * 95);
                    Draw3DIronBar(g, pCenterX, botY - 15, fx, fy, 6);
                }
                using (Pen pArch = new Pen(colIronMid, 7))
                using (Pen pArchHi = new Pen(colIronLight, 2))
                {
                    g.DrawArc(pArch, pCenterX - 75, botY - 145, 150, 130, 180, 180);
                    g.DrawArc(pArchHi, pCenterX - 75, botY - 145, 150, 130, 180, 180);
                }
            }

            bmp.Save("assets/textures/french_balcony_iron.png", ImageFormat.Png);
        }
        Console.WriteLine("-> Đã lưu xong: assets/textures/french_balcony_iron.png (Alpha PNG)");
    }

    private static void Draw3DIronBar(Graphics g, float x1, float y1, float x2, float y2, float thickness)
    {
        using (Pen pShadow = new Pen(Color.FromArgb(240, 12, 14, 18), thickness + 2))
        {
            pShadow.StartCap = LineCap.Round;
            pShadow.EndCap = LineCap.Round;
            g.DrawLine(pShadow, x1 + 1, y1 + 2, x2 + 1, y2 + 2);
        }
        using (Pen pBody = new Pen(Color.FromArgb(255, 42, 45, 50), thickness))
        {
            pBody.StartCap = LineCap.Round;
            pBody.EndCap = LineCap.Round;
            g.DrawLine(pBody, x1, y1, x2, y2);
        }
        using (Pen pLight = new Pen(Color.FromArgb(255, 85, 90, 100), Math.Max(1.0f, thickness * 0.28f)))
        {
            pLight.StartCap = LineCap.Round;
            pLight.EndCap = LineCap.Round;
            g.DrawLine(pLight, x1, y1 - 1, x2, y2 - 1);
        }
    }

    private static void DrawArtNouveauScroll(Graphics g, float cx, float cy, float radius, float flipX, float flipY)
    {
        int numPoints = 50;
        PointF[] pts = new PointF[numPoints];
        for (int p = 0; p < numPoints; p++)
        {
            double t = (double)p / (numPoints - 1.0);
            double theta = t * 3.5 * Math.PI;
            double r = radius * (0.15 + 0.85 * (1.0 - t));
            float px = (float)(cx + Math.Cos(theta) * r * flipX);
            float py = (float)(cy + Math.Sin(theta) * r * flipY);
            pts[p] = new PointF(px, py);
        }

        using (Pen pShadow = new Pen(Color.FromArgb(230, 10, 12, 15), 10))
        using (Pen pMid = new Pen(Color.FromArgb(255, 42, 45, 50), 8))
        using (Pen pHi = new Pen(Color.FromArgb(255, 85, 90, 100), 2.5f))
        {
            g.DrawCurve(pShadow, pts);
            g.DrawCurve(pMid, pts);
            g.DrawCurve(pHi, pts);
        }
    }

    // =========================================================================
    // 3. BOUGAINVILLEA BLOSSOM (1024 x 1024 PNG Trong Suốt)
    // Tán hoa giấy đỏ hồng rực rỡ buông rủ từ ban công chuồng cọp khu tập thể
    // =========================================================================
    public static void GenerateBougainvillea()
    {
        Console.WriteLine("-> Đang vẽ assets/textures/bougainvillea_blossom.png...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            // Nền trong suốt 100%
            g.Clear(Color.FromArgb(0, 0, 0, 0));

            // Thân cành gỗ già uốn lượn rủ xuống
            PointF[][] branchLines = new PointF[][] {
                new PointF[] { new PointF(100, 0), new PointF(180, 150), new PointF(260, 320), new PointF(310, 520), new PointF(340, 750) },
                new PointF[] { new PointF(480, 0), new PointF(500, 180), new PointF(530, 380), new PointF(510, 600), new PointF(490, 840) },
                new PointF[] { new PointF(850, 0), new PointF(790, 200), new PointF(730, 420), new PointF(680, 650), new PointF(650, 820) },
                new PointF[] { new PointF(260, 320), new PointF(210, 480), new PointF(170, 660), new PointF(150, 790) },
                new PointF[] { new PointF(530, 380), new PointF(610, 510), new PointF(630, 680), new PointF(610, 830) },
                new PointF[] { new PointF(730, 420), new PointF(820, 560), new PointF(860, 720), new PointF(870, 860) },
                new PointF[] { new PointF(310, 520), new PointF(390, 650), new PointF(420, 800), new PointF(410, 930) }
            };

            foreach (PointF[] pts in branchLines)
            {
                using (Pen pShadow = new Pen(Color.FromArgb(210, 40, 30, 22), 12))
                using (Pen pBranch = new Pen(Color.FromArgb(235, 75, 55, 40), 9))
                using (Pen pHi = new Pen(Color.FromArgb(190, 115, 85, 60), 3))
                {
                    g.DrawCurve(pShadow, pts);
                    g.DrawCurve(pBranch, pts);
                    g.DrawCurve(pHi, pts);
                }
            }

            // Vẽ hơn 1300 lá cây xanh tự nhiên
            for (int i = 0; i < 1400; i++)
            {
                float lx = rnd.Next(60, 960);
                double maxH = 650 + 250 * Math.Sin(lx / 1024.0 * Math.PI);
                float ly = rnd.Next(20, (int)maxH);
                float ang = rnd.Next(360);
                float scale = 0.5f + (float)rnd.NextDouble() * 0.8f;
                DrawBougainvilleaLeaf(g, lx, ly, ang, scale);
            }

            // Vẽ hơn 1000 đóa hoa giấy nở rộ rực rỡ buông rủ
            for (int j = 0; j < 1100; j++)
            {
                float fx = rnd.Next(70, 950);
                double maxFlowH = 750 + 220 * Math.Sin(fx / 1024.0 * Math.PI);
                float fy = rnd.Next(50, (int)maxFlowH);
                float fscale = 0.55f + (float)rnd.NextDouble() * 0.9f;
                float frot = rnd.Next(360);
                DrawBougainvilleaBractCluster(g, fx, fy, fscale, frot);
            }

            // Cánh hoa rơi lất phất ở đáy
            for (int drop = 0; drop < 90; drop++)
            {
                float dx = rnd.Next(90, 930);
                float dy = rnd.Next(780, 1000);
                float dscale = 0.4f + (float)rnd.NextDouble() * 0.5f;
                DrawBougainvilleaBractCluster(g, dx, dy, dscale, rnd.Next(360));
            }

            bmp.Save("assets/textures/bougainvillea_blossom.png", ImageFormat.Png);
        }
        Console.WriteLine("-> Đã lưu xong: assets/textures/bougainvillea_blossom.png (Alpha PNG)");
    }

    private static void DrawBougainvilleaLeaf(Graphics g, float lx, float ly, float angle, float scale)
    {
        GraphicsState state = g.Save();
        g.TranslateTransform(lx, ly);
        g.RotateTransform(angle);

        float leafW = 22 * scale;
        float leafH = 36 * scale;

        int gr = rnd.Next(75, 140);
        int red = (int)(gr * 0.45);
        int bl = (int)(gr * 0.3);
        Color colLeaf = Color.FromArgb(245, red, gr, bl);
        Color colLeafHi = Color.FromArgb(245, (int)(red * 1.3), (int)(gr * 1.25), (int)(bl * 1.3));

        using (GraphicsPath pLeaf = new GraphicsPath())
        using (SolidBrush bLeaf = new SolidBrush(colLeaf))
        using (Pen pVein = new Pen(colLeafHi, 1.5f))
        {
            pLeaf.AddEllipse(-leafW / 2, -leafH, leafW, leafH);
            g.FillPath(bLeaf, pLeaf);
            g.DrawLine(pVein, 0, 0, 0, -leafH * 0.85f);
        }

        g.Restore(state);
    }

    private static void DrawBougainvilleaBractCluster(Graphics g, float cx, float cy, float scale, float rot)
    {
        GraphicsState state = g.Save();
        g.TranslateTransform(cx, cy);
        g.RotateTransform(rot);

        Color[] colorTypes = new Color[] {
            Color.FromArgb(245, 230, 32, 98),   // Hồng sen rực rỡ
            Color.FromArgb(245, 248, 55, 125),  // Hồng tươi hoa mười giờ
            Color.FromArgb(245, 195, 18, 65),   // Đỏ thắm nhung
            Color.FromArgb(245, 215, 25, 80),   // Đỏ cánh sen
            Color.FromArgb(245, 255, 95, 150)   // Hồng phấn viền mỏng
        };

        // 3 cánh hoa lá bắc tam giác chụm 120 độ
        for (int b = 0; b < 3; b++)
        {
            GraphicsState bState = g.Save();
            g.RotateTransform(b * 120 + rnd.Next(-10, 10));

            float bw = 28 * scale;
            float bh = 46 * scale;
            Color chosenCol = colorTypes[rnd.Next(colorTypes.Length)];

            using (GraphicsPath pBract = new GraphicsPath())
            {
                pBract.AddBezier(0, 0, -bw * 0.8f, -bh * 0.4f, -bw * 0.6f, -bh * 0.9f, 0, -bh);
                pBract.AddBezier(0, -bh, bw * 0.6f, -bh * 0.9f, bw * 0.8f, -bh * 0.4f, 0, 0);

                using (SolidBrush bBract = new SolidBrush(chosenCol))
                using (Pen pVein = new Pen(Color.FromArgb(180, 255, 160, 195), 1.2f))
                using (Pen pRim = new Pen(Color.FromArgb(140, 255, 190, 220), 1.0f))
                {
                    g.FillPath(bBract, pBract);
                    g.DrawLine(pVein, 0, 0, 0, -bh * 0.88f);
                    g.DrawLine(pVein, 0, -bh * 0.4f, -bw * 0.35f, -bh * 0.65f);
                    g.DrawLine(pVein, 0, -bh * 0.4f, bw * 0.35f, -bh * 0.65f);
                    g.DrawPath(pRim, pBract);
                }
            }

            g.Restore(bState);
        }

        // Nhụy hoa kem nhỏ ở tâm
        using (SolidBrush bFloret = new SolidBrush(Color.FromArgb(250, 255, 250, 210)))
        using (SolidBrush bCenter = new SolidBrush(Color.FromArgb(250, 245, 190, 45)))
        {
            g.FillEllipse(bFloret, -4, -4, 8, 8);
            g.FillEllipse(bCenter, -2, -2, 4, 4);
        }

        g.Restore(state);
    }

    // =========================================================================
    // 4. HANOI SHOP SIGNS (2048 x 1024 High Quality JPEG)
    // Biển hiệu vẽ tay thủ công xưa cực kỳ chi tiết:
    // 'PHỞ GIA TRUYỀN', 'CÀ PHÊ TRỨNG PHỐ CỔ', 'HIỆU SÁCH CŨ', 'BÁCH HÓA TỔNG HỢP', 'BIA HƠI HÀ NỘI 1986'
    // =========================================================================
    public static void GenerateShopSigns()
    {
        Console.WriteLine("-> Đang vẽ assets/textures/hanoi_shop_signs.jpg...");
        int w = 2048, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            // Nền tổng thể xi măng hoen ố
            using (SolidBrush bBack = new SolidBrush(Color.FromArgb(45, 42, 40)))
            {
                g.FillRectangle(bBack, 0, 0, w, h);
            }

            StringFormat sfCenter = new StringFormat();
            sfCenter.Alignment = StringAlignment.Center;
            sfCenter.LineAlignment = StringAlignment.Center;

            // -----------------------------------------------------------------
            // BIỂN 1: PHỞ GIA TRUYỀN (40, 40, 940, 280)
            // -----------------------------------------------------------------
            Rectangle rSign1 = new Rectangle(40, 40, 940, 280);
            using (SolidBrush bFrame = new SolidBrush(Color.FromArgb(65, 45, 30)))
            using (SolidBrush bSign = new SolidBrush(Color.FromArgb(24, 52, 38)))
            using (Pen pGold1 = new Pen(Color.FromArgb(215, 175, 55), 4))
            using (Pen pGoldThin = new Pen(Color.FromArgb(165, 130, 40), 1.5f))
            {
                g.FillRectangle(bFrame, 34, 34, 952, 292);
                g.FillRectangle(bSign, rSign1);
                g.DrawRectangle(pGold1, 52, 52, 916, 256);
                g.DrawRectangle(pGoldThin, 58, 58, 904, 244);
            }

            using (Font fPho = new Font("Times New Roman", 52, FontStyle.Bold))
            using (SolidBrush bPhoShadow = new SolidBrush(Color.FromArgb(160, 130, 20, 20)))
            using (SolidBrush bPhoGold = new SolidBrush(Color.FromArgb(250, 235, 110)))
            {
                g.DrawString("PHỞ GIA TRUYỀN", fPho, bPhoShadow, 513, 118, sfCenter);
                g.DrawString("PHỞ GIA TRUYỀN", fPho, bPhoGold, 510, 114, sfCenter);
            }

            using (Font fSub1 = new Font("Arial", 22, FontStyle.Bold))
            using (SolidBrush bSub1 = new SolidBrush(Color.FromArgb(235, 75, 60)))
            {
                g.DrawString("BÒ TÁI  •  NẠM  •  GẦU  •  SỐT VANG", fSub1, bSub1, 510, 185, sfCenter);
            }

            using (Font fFoot1 = new Font("Arial", 14, FontStyle.Regular))
            using (SolidBrush bFoot1 = new SolidBrush(Color.FromArgb(200, 215, 180)))
            {
                g.DrawString("HÀ NỘI XƯA  •  ĐẬM ĐÀ NƯỚC DÙNG TRUYỀN THỐNG TỪ NĂM 1954", fFoot1, bFoot1, 510, 240, sfCenter);
            }
            ApplySignWeathering(g, rSign1);

            // -----------------------------------------------------------------
            // BIỂN 2: CÀ PHÊ TRỨNG PHỐ CỔ (1040, 40, 960, 280)
            // -----------------------------------------------------------------
            Rectangle rSign2 = new Rectangle(1040, 40, 960, 280);
            using (SolidBrush bWood = new SolidBrush(Color.FromArgb(72, 44, 25)))
            using (Pen pWoodFrame = new Pen(Color.FromArgb(40, 24, 12), 6))
            using (Pen pWoodInner = new Pen(Color.FromArgb(145, 105, 60), 2))
            {
                g.FillRectangle(bWood, rSign2);
                for (int wline = 44; wline < 315; wline += 6)
                {
                    using (Pen pGrain = new Pen(Color.FromArgb(35, 120, 75, 40), 2))
                    {
                        g.DrawLine(pGrain, 1040, wline, 2000, wline);
                    }
                }
                g.DrawRectangle(pWoodFrame, 1044, 44, 952, 272);
                g.DrawRectangle(pWoodInner, 1054, 54, 932, 252);
            }

            // Đinh đồng 4 góc
            using (SolidBrush bStud = new SolidBrush(Color.FromArgb(210, 165, 75)))
            {
                g.FillEllipse(bStud, 1060, 60, 16, 16);
                g.FillEllipse(bStud, 1964, 60, 16, 16);
                g.FillEllipse(bStud, 1060, 284, 16, 16);
                g.FillEllipse(bStud, 1964, 284, 16, 16);
            }

            using (Font fCoffee = new Font("Georgia", 48, FontStyle.Bold))
            using (SolidBrush bCofShadow = new SolidBrush(Color.FromArgb(200, 25, 15, 8)))
            using (SolidBrush bCofGold = new SolidBrush(Color.FromArgb(245, 215, 125)))
            {
                g.DrawString("CÀ PHÊ TRỨNG", fCoffee, bCofShadow, 1523, 114, sfCenter);
                g.DrawString("CÀ PHÊ TRỨNG", fCoffee, bCofGold, 1520, 110, sfCenter);
            }

            using (Font fSubCoffee = new Font("Times New Roman", 24, FontStyle.Italic))
            using (SolidBrush bSubCoffee = new SolidBrush(Color.FromArgb(235, 185, 110)))
            {
                g.DrawString("- PHỐ CỔ HÀ NỘI -", fSubCoffee, bSubCoffee, 1520, 180, sfCenter);
            }

            using (Font fFootCoffee = new Font("Arial", 15, FontStyle.Bold))
            using (SolidBrush bFootCoffee = new SolidBrush(Color.FromArgb(200, 155, 95)))
            {
                g.DrawString("CÀ PHÊ PHIN TRUYỀN THỐNG  •  KEM TRỨNG BÉO NGẬY HƯƠNG HÀ NỘI", fFootCoffee, bFootCoffee, 1520, 235, sfCenter);
            }
            ApplySignWeathering(g, rSign2);

            // -----------------------------------------------------------------
            // BIỂN 3: BÁCH HÓA TỔNG HỢP (40, 360, 940, 300)
            // -----------------------------------------------------------------
            Rectangle rSign3 = new Rectangle(40, 360, 940, 300);
            using (SolidBrush bStFrame = new SolidBrush(Color.FromArgb(50, 40, 35)))
            using (SolidBrush bRedGov = new SolidBrush(Color.FromArgb(175, 28, 25)))
            using (Pen pGovBorder = new Pen(Color.FromArgb(240, 205, 65), 5))
            {
                g.FillRectangle(bStFrame, 34, 354, 952, 312);
                g.FillRectangle(bRedGov, rSign3);
                g.DrawRectangle(pGovBorder, 54, 374, 912, 272);
            }

            using (Font fGovTop = new Font("Arial", 17, FontStyle.Bold))
            using (SolidBrush bGovYellow = new SolidBrush(Color.FromArgb(245, 215, 75)))
            {
                g.DrawString("CỬA HÀNG MẬU DỊCH QUỐC DOANH SỐ 12", fGovTop, bGovYellow, 510, 412, sfCenter);
            }

            using (Font fGovMain = new Font("Impact", 56, FontStyle.Regular))
            using (SolidBrush bBlackShadow = new SolidBrush(Color.FromArgb(220, 20, 10, 10)))
            using (SolidBrush bGovBright = new SolidBrush(Color.FromArgb(255, 235, 60)))
            {
                g.DrawString("BÁCH HÓA TỔNG HỢP", fGovMain, bBlackShadow, 514, 482, sfCenter);
                g.DrawString("BÁCH HÓA TỔNG HỢP", fGovMain, bGovBright, 510, 478, sfCenter);
            }

            using (Font fGovBot = new Font("Arial", 15, FontStyle.Bold))
            using (SolidBrush bGovWhite = new SolidBrush(Color.FromArgb(245, 245, 235)))
            {
                g.DrawString("PHỤC VỤ TẬN TÌNH  •  PHÂN PHỐI THEO TEM PHIẾU TIÊU CHUẨN", fGovBot, bGovWhite, 510, 560, sfCenter);
            }
            ApplySignWeathering(g, rSign3);

            // -----------------------------------------------------------------
            // BIỂN 4: BIA HƠI HÀ NỘI 1986 (1040, 360, 960, 300)
            // -----------------------------------------------------------------
            Rectangle rSign4 = new Rectangle(1040, 360, 960, 300);
            using (SolidBrush bBeerFrame = new SolidBrush(Color.FromArgb(45, 30, 20)))
            using (SolidBrush bBeerBg = new SolidBrush(Color.FromArgb(235, 160, 30)))
            using (Pen pBeerBorder = new Pen(Color.FromArgb(160, 25, 20), 6))
            {
                g.FillRectangle(bBeerFrame, 1034, 354, 972, 312);
                g.FillRectangle(bBeerBg, rSign4);
                g.DrawRectangle(pBeerBorder, 1054, 374, 932, 272);
            }

            using (Font fBeer = new Font("Arial", 54, FontStyle.Bold))
            using (SolidBrush bBeerShadow = new SolidBrush(Color.FromArgb(190, 60, 15, 10)))
            using (SolidBrush bBeerRed = new SolidBrush(Color.FromArgb(195, 25, 20)))
            {
                g.DrawString("BIA HƠI HÀ NỘI", fBeer, bBeerShadow, 1524, 452, sfCenter);
                g.DrawString("BIA HƠI HÀ NỘI", fBeer, bBeerRed, 1520, 448, sfCenter);
            }

            using (Font fYear = new Font("Impact", 36, FontStyle.Regular))
            using (SolidBrush bYear = new SolidBrush(Color.FromArgb(45, 30, 25)))
            {
                g.DrawString("*  1 9 8 6  *", fYear, bYear, 1520, 524, sfCenter);
            }

            using (Font fBeerSub = new Font("Arial", 15, FontStyle.Bold))
            using (SolidBrush bBeerSub = new SolidBrush(Color.FromArgb(120, 20, 15)))
            {
                g.DrawString("ĐẬM ĐÀ HƯƠNG VỊ THỦ ĐÔ  •  CỐC VẠI XANH HUYỀN THOẠI", fBeerSub, bBeerSub, 1520, 582, sfCenter);
            }
            ApplySignWeathering(g, rSign4);

            // -----------------------------------------------------------------
            // BIỂN 5: HIỆU SÁCH CŨ (40, 700, 1960, 280)
            // -----------------------------------------------------------------
            Rectangle rSign5 = new Rectangle(40, 700, 1960, 280);
            using (SolidBrush bFrame5 = new SolidBrush(Color.FromArgb(48, 34, 24)))
            using (SolidBrush bPaper = new SolidBrush(Color.FromArgb(228, 210, 168)))
            using (Pen pBookBorder = new Pen(Color.FromArgb(35, 55, 80), 4))
            using (Pen pBookThin = new Pen(Color.FromArgb(120, 100, 70), 1.5f))
            {
                g.FillRectangle(bFrame5, 34, 694, 1972, 292);
                g.FillRectangle(bPaper, rSign5);
                g.DrawRectangle(pBookBorder, 54, 714, 1932, 252);
                g.DrawRectangle(pBookThin, 62, 722, 1916, 236);
            }

            using (Font fBook = new Font("Georgia", 60, FontStyle.Bold))
            using (SolidBrush bInkShadow = new SolidBrush(Color.FromArgb(140, 40, 45, 50)))
            using (SolidBrush bInk = new SolidBrush(Color.FromArgb(25, 48, 85)))
            {
                g.DrawString("HIỆU SÁCH CŨ", fBook, bInkShadow, 1024, 782, sfCenter);
                g.DrawString("HIỆU SÁCH CŨ", fBook, bInk, 1020, 778, sfCenter);
            }

            using (Font fBookSub = new Font("Times New Roman", 24, FontStyle.Italic))
            using (SolidBrush bBookSub = new SolidBrush(Color.FromArgb(120, 35, 30)))
            {
                g.DrawString("Chuyên: SÁCH VĂN HỌC  •  LỊCH SỬ  •  BÁO CŨ  •  TRANH ẢNH HÀ NỘI XƯA", fBookSub, bBookSub, 1020, 858, sfCenter);
            }

            using (Font fBookFoot = new Font("Arial", 16, FontStyle.Bold))
            using (SolidBrush bBookFoot = new SolidBrush(Color.FromArgb(75, 65, 55)))
            {
                g.DrawString("THU MUA & TRAO ĐỔI SÁCH QUÝ  -  LƯU GIỮ KÝ ỨC THĂNG LONG HÀ NỘI", fBookFoot, bBookFoot, 1020, 915, sfCenter);
            }
            ApplySignWeathering(g, rSign5);

            SaveHighQualityJpeg(bmp, "assets/textures/hanoi_shop_signs.jpg", 95L);
        }
        Console.WriteLine("-> Đã lưu xong: assets/textures/hanoi_shop_signs.jpg (2048x1024)");
    }

    private static void ApplySignWeathering(Graphics g, Rectangle rect)
    {
        for (int k = 0; k < 450; k++)
        {
            int gx = rect.X + rnd.Next(rect.Width);
            int gy = rect.Y + rnd.Next(rect.Height);
            int gsz = rnd.Next(2, 28);
            int galpha = rnd.Next(15, 60);
            using (SolidBrush bGr = new SolidBrush(Color.FromArgb(galpha, 45, 25, 12)))
            {
                g.FillEllipse(bGr, gx, gy, gsz, gsz);
            }
        }

        // Vết tróc sơn ở mép biển
        for (int e = 0; e < 120; e++)
        {
            int ex = rect.X + rnd.Next(rect.Width);
            int ey = (rnd.Next(2) == 0) ? rect.Y + rnd.Next(16) : rect.Y + rect.Height - rnd.Next(1, 16);
            using (SolidBrush bPeel = new SolidBrush(Color.FromArgb(180, 80, 50, 30)))
            {
                g.FillRectangle(bPeel, ex, ey, rnd.Next(4, 20), rnd.Next(3, 8));
            }
        }
    }
}

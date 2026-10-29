using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class GenerateArtAssetsPro
{
    private static Random rnd = new Random(2026);

    public static void Main(string[] args)
    {
        Console.WriteLine("=== BẮT ĐẦU NÂNG CẤP TEXTURE PHOTOREALISTIC ĐỈNH CAO HÀ NỘI ===");

        Directory.CreateDirectory("assets/textures");

        UpgradeGreenShutter();
        UpgradeBalconyIron();
        UpgradeShopSigns();
        UpgradeBougainvillea();

        Console.WriteLine("=== TOÀN BỘ TEXTURE ĐÃ ĐẠT CHẤT LƯỢNG MỸ THUẬT SIÊU THỰC TẾ! ===");
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
    // 1. HANOI_GREEN_SHUTTER.JPG (1024 x 1024)
    // Tường vàng nứt nẻ thật + Cửa chớp gỗ Pháp cổ nan tróc sơn + Then đồng xưa
    // =========================================================================
    public static void UpgradeGreenShutter()
    {
        Console.WriteLine("-> Nâng cấp Photorealistic: assets/textures/hanoi_green_shutter.jpg...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            // 1.1 Load trực tiếp tường vàng nứt nẻ Hà Nội thực tế làm nền
            if (File.Exists("assets/textures/old_wall_yellow.jpg"))
            {
                using (Image imgWall = Image.FromFile("assets/textures/old_wall_yellow.jpg"))
                {
                    g.DrawImage(imgWall, 0, 0, w, h);
                }
            }
            else
            {
                using (SolidBrush bWall = new SolidBrush(Color.FromArgb(215, 178, 92)))
                {
                    g.FillRectangle(bWall, 0, 0, w, h);
                }
            }

            // 1.2 Khung hốc tường & Khung bao cửa gỗ lim sẫm (Outer Molded Frame)
            int framePad = 52;
            int frameW = w - framePad * 2;
            int frameH = h - framePad * 2;
            Rectangle rectFrame = new Rectangle(framePad, framePad, frameW, frameH);

            // Bóng đổ sâu từ gờ tường vào cửa sổ
            using (Pen penDeep1 = new Pen(Color.FromArgb(200, 15, 12, 10), 22))
            using (Pen penDeep2 = new Pen(Color.FromArgb(130, 20, 15, 10), 12))
            {
                g.DrawRectangle(penDeep1, framePad - 8, framePad - 8, frameW + 16, frameH + 16);
                g.DrawRectangle(penDeep2, framePad - 2, framePad - 2, frameW + 4, frameH + 4);
            }

            // Gỗ lim đen sẫm của khung bao ngoài
            using (LinearGradientBrush bWoodFrame = new LinearGradientBrush(rectFrame, Color.FromArgb(46, 32, 22), Color.FromArgb(32, 22, 15), LinearGradientMode.ForwardDiagonal))
            {
                g.FillRectangle(bWoodFrame, rectFrame);
            }

            // Chỉ phào phay rãnh chỉ cổ điển (Classical French molding bevels)
            int moldPad = 22;
            Rectangle rectMold = new Rectangle(framePad + moldPad, framePad + moldPad, frameW - moldPad * 2, frameH - moldPad * 2);
            using (Pen penMoldingHi = new Pen(Color.FromArgb(78, 55, 38), 4))
            using (Pen penMoldingShadow = new Pen(Color.FromArgb(20, 14, 10), 5))
            {
                g.DrawRectangle(penMoldingShadow, rectMold);
                g.DrawLine(penMoldingHi, rectMold.Left, rectMold.Top, rectMold.Right, rectMold.Top);
                g.DrawLine(penMoldingHi, rectMold.Left, rectMold.Top, rectMold.Left, rectMold.Bottom);
            }

            // 1.3 Hai cánh cửa chớp (Double Louvered Shutters)
            int doorGap = 6;
            int doorPad = 32;
            int totalShutterW = frameW - doorPad * 2;
            int shutterW = (totalShutterW - doorGap) / 2;
            int shutterH = frameH - doorPad * 2;
            int shutterTop = framePad + doorPad;

            Rectangle rectLeft = new Rectangle(framePad + doorPad, shutterTop, shutterW, shutterH);
            Rectangle rectRight = new Rectangle(framePad + doorPad + shutterW + doorGap, shutterTop, shutterW, shutterH);

            DrawProShutterDoor(g, rectLeft, true);
            DrawProShutterDoor(g, rectRight, false);

            // 1.4 Bản lề sắt Pháp cổ (Antique Wrought Iron Strap Hinges)
            int[] hingeYs = new int[] { shutterTop + 55, shutterTop + (int)(shutterH * 0.48), shutterTop + shutterH - 75 };
            foreach (int hy in hingeYs)
            {
                // Cánh trái
                DrawStrapHinge(g, rectLeft.X - 10, hy, 46, 18, true);
                // Cánh phải
                DrawStrapHinge(g, rectRight.X + rectRight.Width - 36, hy, 46, 18, false);
            }

            // 1.5 Then cài đồng thau cổ ở giữa 2 cánh cửa (Vintage Brass Bolt)
            int latchY = shutterTop + (int)(shutterH * 0.52) - 18;
            int latchX = rectLeft.X + shutterW - 48;
            DrawVintageBrassLatch(g, latchX, latchY);

            SaveHighQualityJpeg(bmp, "assets/textures/hanoi_green_shutter.jpg", 96L);
        }
        Console.WriteLine("-> Nâng cấp thành công: assets/textures/hanoi_green_shutter.jpg");
    }

    private static void DrawProShutterDoor(Graphics g, Rectangle rect, bool isLeft)
    {
        Color colGreenBase = Color.FromArgb(36, 68, 48);
        Color colGreenDark = Color.FromArgb(22, 42, 30);
        Color colGreenLight = Color.FromArgb(55, 96, 68);
        Color colWoodBare = Color.FromArgb(138, 98, 62);
        Color colWoodDark = Color.FromArgb(75, 52, 32);

        // Khung cánh
        using (LinearGradientBrush bFrameGrad = new LinearGradientBrush(rect, colGreenLight, colGreenDark, LinearGradientMode.Vertical))
        using (Pen pStile = new Pen(colGreenDark, 3))
        {
            g.FillRectangle(bFrameGrad, rect);
            g.DrawRectangle(pStile, rect);
        }

        int stileW = 32;
        int railH = 32;
        int midRailH = 38;
        int midRailY = rect.Y + (int)(rect.Height * 0.52);
        Rectangle rectMidRail = new Rectangle(rect.X, midRailY, rect.Width, midRailH);

        using (LinearGradientBrush bMidGrad = new LinearGradientBrush(rectMidRail, colGreenLight, colGreenDark, LinearGradientMode.Vertical))
        using (Pen pMid = new Pen(colGreenDark, 2))
        using (Pen pMidHi = new Pen(Color.FromArgb(75, 125, 90), 1.5f))
        {
            g.FillRectangle(bMidGrad, rectMidRail);
            g.DrawRectangle(pMid, rectMidRail);
            g.DrawLine(pMidHi, rectMidRail.Left, rectMidRail.Top + 1, rectMidRail.Right, rectMidRail.Top + 1);
        }

        // Louver sections (2 tầng)
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

                // Bóng đổ sâu dưới mỗi nan chớp
                using (SolidBrush bShadow = new SolidBrush(Color.FromArgb(140, 12, 22, 16)))
                {
                    g.FillRectangle(bShadow, innerX, ly + 7, innerW, 8);
                }

                // Thân nan chớp gỗ nghiêng góc với gradient nổi khối 3D
                Rectangle rectLouver = new Rectangle(innerX, ly, innerW, lh);
                using (LinearGradientBrush gLouver = new LinearGradientBrush(rectLouver, colGreenLight, colGreenDark, LinearGradientMode.Vertical))
                {
                    g.FillRectangle(gLouver, rectLouver);
                }

                // Mép trên vát hứng ánh sáng mặt trời tự nhiên
                using (Pen pHi = new Pen(Color.FromArgb(90, 148, 105), 1.5f))
                {
                    g.DrawLine(pHi, innerX, ly, innerX + innerW, ly);
                }

                // Mép dưới góc tối
                using (Pen pLow = new Pen(Color.FromArgb(18, 35, 24), 1.0f))
                {
                    g.DrawLine(pLow, innerX, ly + lh - 1, innerX + innerW, ly + lh - 1);
                }

                // Vết tróc sơn tự nhiên để lộ thớ gỗ sồi/lim mộc
                if (rnd.Next(100) < 42)
                {
                    int chipX = innerX + rnd.Next(10, innerW - 40);
                    int chipW = rnd.Next(16, 50);
                    int chipY = ly + rnd.Next(2, 6);
                    int chipH = rnd.Next(4, 8);

                    using (SolidBrush bBare = new SolidBrush(colWoodBare))
                    {
                        g.FillRectangle(bBare, chipX, chipY, chipW, chipH);
                    }
                    using (Pen pCrack = new Pen(colWoodDark, 1.2f))
                    {
                        g.DrawLine(pCrack, chipX + 2, chipY + chipH / 2, chipX + chipW - 2, chipY + chipH / 2);
                    }
                    // Viền tróc sơn trắng mờ
                    using (Pen pEdge = new Pen(Color.FromArgb(160, 200, 220, 205), 0.8f))
                    {
                        g.DrawRectangle(pEdge, chipX, chipY, chipW, chipH);
                    }
                }
            }
        }

        // Vết trầy tróc sơn và vân gỗ dọc theo khung cánh
        for (int k = 0; k < 45; k++)
        {
            int wx = rect.X + rnd.Next(2, stileW);
            if (rnd.Next(2) == 1) wx = rect.X + rect.Width - stileW + rnd.Next(2, stileW);
            int wy = rect.Y + rnd.Next(10, rect.Height - 60);
            int wh = rnd.Next(20, 85);

            using (SolidBrush bPeel = new SolidBrush(Color.FromArgb(175, 128, 88, 55)))
            {
                g.FillRectangle(bPeel, wx, wy, rnd.Next(3, 8), wh);
            }
        }
    }

    private static void DrawStrapHinge(Graphics g, int hx, int hy, int hw, int hh, bool isLeft)
    {
        Rectangle rectH = new Rectangle(hx, hy, hw, hh);
        using (LinearGradientBrush bIron = new LinearGradientBrush(rectH, Color.FromArgb(48, 52, 58), Color.FromArgb(22, 24, 28), LinearGradientMode.Vertical))
        using (Pen pIron = new Pen(Color.FromArgb(15, 16, 18), 1.5f))
        {
            g.FillRectangle(bIron, rectH);
            g.DrawRectangle(pIron, rectH);
        }

        // Đinh tán tròn đầu nổi khối
        int rivet1X = isLeft ? hx + 14 : hx + 14;
        int rivet2X = isLeft ? hx + 32 : hx + 32;

        DrawRivet(g, rivet1X, hy + 4, 10);
        DrawRivet(g, rivet2X, hy + 4, 10);
    }

    private static void DrawRivet(Graphics g, int rx, int ry, int size)
    {
        Rectangle r = new Rectangle(rx, ry, size, size);
        using (LinearGradientBrush bRivet = new LinearGradientBrush(r, Color.FromArgb(90, 85, 80), Color.FromArgb(30, 28, 26), LinearGradientMode.ForwardDiagonal))
        using (Pen pRivet = new Pen(Color.FromArgb(15, 15, 15), 1))
        {
            g.FillEllipse(bRivet, r);
            g.DrawEllipse(pRivet, r);
        }
    }

    private static void DrawVintageBrassLatch(Graphics g, int lx, int ly)
    {
        Rectangle rectPlate = new Rectangle(lx, ly, 102, 56);
        // Tấm đế đồng thau
        using (LinearGradientBrush bPlate = new LinearGradientBrush(rectPlate, Color.FromArgb(195, 155, 65), Color.FromArgb(125, 95, 38), LinearGradientMode.Vertical))
        using (Pen pPlate = new Pen(Color.FromArgb(85, 60, 20), 2))
        {
            g.FillRectangle(bPlate, rectPlate);
            g.DrawRectangle(pPlate, rectPlate);
        }

        // Rỉ đồng xanh verdigris
        using (SolidBrush bVerd = new SolidBrush(Color.FromArgb(140, 55, 140, 110)))
        {
            g.FillEllipse(bVerd, lx + 8, ly + 6, 35, 22);
            g.FillEllipse(bVerd, lx + 54, ly + 14, 40, 26);
            g.FillEllipse(bVerd, lx + 30, ly + 28, 28, 20);
        }

        // Then chốt ngang bằng đồng sáng khối
        Rectangle rectBar = new Rectangle(lx - 12, ly + 20, 126, 17);
        using (LinearGradientBrush bBar = new LinearGradientBrush(rectBar, Color.FromArgb(250, 215, 115), Color.FromArgb(145, 105, 42), LinearGradientMode.Vertical))
        using (Pen pBar = new Pen(Color.FromArgb(95, 68, 25), 1.5f))
        {
            g.FillRectangle(bBar, rectBar);
            g.DrawRectangle(pBar, rectBar);
        }

        // Núm xoay đồng tròn
        Rectangle rectKnob = new Rectangle(lx + 43, ly + 14, 28, 28);
        using (LinearGradientBrush bKnob = new LinearGradientBrush(rectKnob, Color.FromArgb(255, 230, 135), Color.FromArgb(165, 120, 48), LinearGradientMode.ForwardDiagonal))
        using (Pen pKnob = new Pen(Color.FromArgb(105, 75, 25), 2))
        {
            g.FillEllipse(bKnob, rectKnob);
            g.DrawEllipse(pKnob, rectKnob);
        }

        // 4 ốc đồng góc
        DrawRivet(g, lx + 6, ly + 6, 8);
        DrawRivet(g, lx + 88, ly + 6, 8);
        DrawRivet(g, lx + 6, ly + 42, 8);
        DrawRivet(g, lx + 88, ly + 42, 8);
    }

    // =========================================================================
    // 2. FRENCH_BALCONY_IRON.PNG (1024 x 1024 PNG Trong Suốt)
    // Sắt rèn cổ điển dập vân rỉ sét từ texture thật + Art Deco / Art Nouveau
    // =========================================================================
    public static void UpgradeBalconyIron()
    {
        Console.WriteLine("-> Nâng cấp Photorealistic: assets/textures/french_balcony_iron.png...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            g.Clear(Color.FromArgb(0, 0, 0, 0));

            // Tay vịn trên cùng (Top Handrail)
            int topY = 90;
            Draw3DIronBarPro(g, 15, topY - 16, 1009, topY - 16, 24);
            Draw3DIronBarPro(g, 15, topY, 1009, topY, 18);
            Draw3DIronBarPro(g, 15, topY + 16, 1009, topY + 16, 14);

            // Xà dưới cùng (Bottom Rail)
            int botY = 930;
            Draw3DIronBarPro(g, 15, botY - 14, 1009, botY - 14, 15);
            Draw3DIronBarPro(g, 15, botY, 1009, botY, 24);
            Draw3DIronBarPro(g, 15, botY + 16, 1009, botY + 16, 14);

            // Xà phụ giữa
            int midY1 = 340;
            int midY2 = 680;
            Draw3DIronBarPro(g, 20, midY1, 1004, midY1, 12);
            Draw3DIronBarPro(g, 20, midY2, 1004, midY2, 12);

            // Cột trụ đứng kép chia 4 ô panel nghệ thuật
            for (int col = 0; col <= 4; col++)
            {
                int postX = 32 + (col * (w - 64) / 4);
                Draw3DIronBarPro(g, postX - 6, topY - 20, postX - 6, botY + 20, 13);
                Draw3DIronBarPro(g, postX + 6, topY - 20, postX + 6, botY + 20, 13);

                // Đinh tán nổi 3D
                for (int ry = topY; ry <= botY; ry += 170)
                {
                    Rectangle r = new Rectangle(postX - 12, ry - 10, 24, 20);
                    using (LinearGradientBrush bRivet = new LinearGradientBrush(r, Color.FromArgb(255, 80, 85, 95), Color.FromArgb(255, 25, 28, 32), LinearGradientMode.ForwardDiagonal))
                    using (Pen pRivet = new Pen(Color.FromArgb(255, 12, 14, 16), 2))
                    {
                        g.FillEllipse(bRivet, r);
                        g.DrawEllipse(pRivet, r);
                    }
                }
            }

            // Họa tiết trong 4 ô panel
            for (int p = 0; p < 4; p++)
            {
                int pLeft = 32 + (p * (w - 64) / 4) + 16;
                int pRight = 32 + ((p + 1) * (w - 64) / 4) - 16;
                int pCenterX = (pLeft + pRight) / 2;

                // TẦNG TRÊN: Vòng tròn Art Deco & Nan hoa
                int circleCenterY = (topY + midY1) / 2;
                int circleRadius = 56;
                DrawIronCirclePro(g, pCenterX, circleCenterY, circleRadius, 9);
                DrawIronCirclePro(g, pCenterX, circleCenterY, 28, 5);

                Draw3DIronBarPro(g, pCenterX - 90, circleCenterY, pCenterX - 56, circleCenterY, 8);
                Draw3DIronBarPro(g, pCenterX + 56, circleCenterY, pCenterX + 90, circleCenterY, 8);
                Draw3DIronBarPro(g, pCenterX, circleCenterY - 95, pCenterX, circleCenterY - 56, 8);
                Draw3DIronBarPro(g, pCenterX, circleCenterY + 56, pCenterX, circleCenterY + 95, 8);

                // TẦNG GIỮA: Cặp xoắn ốc Art Nouveau (Double Spiral Heart Lyre)
                int midCenterY = (midY1 + midY2) / 2;
                DrawArtNouveauScrollPro(g, pCenterX - 38, midCenterY - 45, 60, 1, 1);
                DrawArtNouveauScrollPro(g, pCenterX + 38, midCenterY - 45, 60, -1, 1);
                DrawArtNouveauScrollPro(g, pCenterX - 38, midCenterY + 45, 60, 1, -1);
                DrawArtNouveauScrollPro(g, pCenterX + 38, midCenterY + 45, 60, -1, -1);

                Draw3DIronBarPro(g, pCenterX, midY1 + 10, pCenterX, midY2 - 10, 10);

                // Búp sen giữa
                PointF[] fleurPts = new PointF[] {
                    new PointF(pCenterX, midCenterY - 26),
                    new PointF(pCenterX - 20, midCenterY),
                    new PointF(pCenterX, midCenterY + 26),
                    new PointF(pCenterX + 20, midCenterY)
                };
                using (SolidBrush bFleur = new SolidBrush(Color.FromArgb(255, 38, 41, 46)))
                using (Pen pFleur = new Pen(Color.FromArgb(255, 85, 92, 102), 1.5f))
                {
                    g.FillPolygon(bFleur, fleurPts);
                    g.DrawPolygon(pFleur, fleurPts);
                }
                // Đai kẹp sắt rèn (Collar clamp)
                Rectangle rClamp = new Rectangle(pCenterX - 15, midCenterY - 9, 30, 18);
                using (LinearGradientBrush bClamp = new LinearGradientBrush(rClamp, Color.FromArgb(255, 75, 80, 90), Color.FromArgb(255, 30, 32, 36), LinearGradientMode.Vertical))
                {
                    g.FillRectangle(bClamp, rClamp);
                }

                // TẦNG DƯỚI: Nan rẻ quạt Art Deco đối xứng
                for (double ang = -45; ang <= 45; ang += 22.5)
                {
                    double rad = ang * Math.PI / 180.0;
                    float fx = (float)(pCenterX + Math.Sin(rad) * 108);
                    float fy = (float)(botY - 15 - Math.Cos(rad) * 98);
                    Draw3DIronBarPro(g, pCenterX, botY - 15, fx, fy, 7);
                }
                using (Pen pArch = new Pen(Color.FromArgb(255, 38, 41, 46), 8))
                using (Pen pArchHi = new Pen(Color.FromArgb(255, 85, 90, 102), 2))
                {
                    g.DrawArc(pArch, pCenterX - 76, botY - 146, 152, 132, 180, 180);
                    g.DrawArc(pArchHi, pCenterX - 76, botY - 146, 152, 132, 180, 180);
                }
            }

            bmp.Save("assets/textures/french_balcony_iron.png", ImageFormat.Png);
        }
        Console.WriteLine("-> Nâng cấp thành công: assets/textures/french_balcony_iron.png (Alpha PNG)");
    }

    private static void Draw3DIronBarPro(Graphics g, float x1, float y1, float x2, float y2, float thickness)
    {
        // 1. Bóng tối sâu
        using (Pen pShadow = new Pen(Color.FromArgb(230, 10, 12, 15), thickness + 3))
        {
            pShadow.StartCap = LineCap.Round;
            pShadow.EndCap = LineCap.Round;
            g.DrawLine(pShadow, x1 + 1, y1 + 2, x2 + 1, y2 + 2);
        }
        // 2. Thân sắt rèn xám kim loại
        using (Pen pBody = new Pen(Color.FromArgb(255, 38, 41, 46), thickness))
        {
            pBody.StartCap = LineCap.Round;
            pBody.EndCap = LineCap.Round;
            g.DrawLine(pBody, x1, y1, x2, y2);
        }
        // 3. Highlight ánh kim loại sắc nét
        using (Pen pLight = new Pen(Color.FromArgb(255, 95, 102, 115), Math.Max(1.2f, thickness * 0.28f)))
        {
            pLight.StartCap = LineCap.Round;
            pLight.EndCap = LineCap.Round;
            g.DrawLine(pLight, x1, y1 - 1, x2, y2 - 1);
        }
    }

    private static void DrawIronCirclePro(Graphics g, float cx, float cy, float radius, float thickness)
    {
        using (Pen pShadow = new Pen(Color.FromArgb(230, 10, 12, 15), thickness + 2))
        using (Pen pMid = new Pen(Color.FromArgb(255, 38, 41, 46), thickness))
        using (Pen pHi = new Pen(Color.FromArgb(255, 95, 102, 115), Math.Max(1.2f, thickness * 0.25f)))
        {
            g.DrawEllipse(pShadow, cx - radius + 1, cy - radius + 1, radius * 2, radius * 2);
            g.DrawEllipse(pMid, cx - radius, cy - radius, radius * 2, radius * 2);
            g.DrawEllipse(pHi, cx - radius, cy - radius - 1, radius * 2, radius * 2);
        }
    }

    private static void DrawArtNouveauScrollPro(Graphics g, float cx, float cy, float radius, float flipX, float flipY)
    {
        int numPoints = 60;
        PointF[] pts = new PointF[numPoints];
        for (int p = 0; p < numPoints; p++)
        {
            double t = (double)p / (numPoints - 1.0);
            double theta = t * 3.6 * Math.PI;
            double r = radius * (0.15 + 0.85 * (1.0 - t));
            float px = (float)(cx + Math.Cos(theta) * r * flipX);
            float py = (float)(cy + Math.Sin(theta) * r * flipY);
            pts[p] = new PointF(px, py);
        }

        using (Pen pShadow = new Pen(Color.FromArgb(230, 10, 12, 15), 11))
        using (Pen pMid = new Pen(Color.FromArgb(255, 38, 41, 46), 9))
        using (Pen pHi = new Pen(Color.FromArgb(255, 95, 102, 115), 2.5f))
        {
            g.DrawCurve(pShadow, pts);
            g.DrawCurve(pMid, pts);
            g.DrawCurve(pHi, pts);
        }
    }

    // =========================================================================
    // 3. BOUGAINVILLEA_BLOSSOM.PNG (1024 x 1024 PNG Trong Suốt)
    // Tán hoa giấy rực rỡ buông rủ ban công chuồng cọp khu tập thể
    // =========================================================================
    public static void UpgradeBougainvillea()
    {
        Console.WriteLine("-> Nâng cấp Photorealistic: assets/textures/bougainvillea_blossom.png...");
        int w = 1024, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;

            g.Clear(Color.FromArgb(0, 0, 0, 0));

            // Thân cành gỗ già buông rủ
            PointF[][] branchLines = new PointF[][] {
                new PointF[] { new PointF(90, 0), new PointF(170, 150), new PointF(250, 320), new PointF(300, 520), new PointF(330, 750) },
                new PointF[] { new PointF(480, 0), new PointF(500, 180), new PointF(530, 380), new PointF(510, 600), new PointF(490, 840) },
                new PointF[] { new PointF(860, 0), new PointF(800, 200), new PointF(740, 420), new PointF(690, 650), new PointF(660, 820) },
                new PointF[] { new PointF(250, 320), new PointF(200, 480), new PointF(160, 660), new PointF(140, 790) },
                new PointF[] { new PointF(530, 380), new PointF(610, 510), new PointF(630, 680), new PointF(610, 830) },
                new PointF[] { new PointF(740, 420), new PointF(830, 560), new PointF(870, 720), new PointF(880, 860) },
                new PointF[] { new PointF(300, 520), new PointF(380, 650), new PointF(410, 800), new PointF(400, 930) }
            };

            foreach (PointF[] pts in branchLines)
            {
                using (Pen pShadow = new Pen(Color.FromArgb(220, 35, 25, 18), 14))
                using (Pen pBranch = new Pen(Color.FromArgb(240, 70, 50, 35), 10))
                using (Pen pHi = new Pen(Color.FromArgb(190, 115, 85, 60), 3))
                {
                    g.DrawCurve(pShadow, pts);
                    g.DrawCurve(pBranch, pts);
                    g.DrawCurve(pHi, pts);
                }
            }

            // 1500 lá cây xanh tự nhiên
            for (int i = 0; i < 1500; i++)
            {
                float lx = rnd.Next(50, 974);
                double maxH = 680 + 260 * Math.Sin(lx / 1024.0 * Math.PI);
                float ly = rnd.Next(15, (int)maxH);
                float ang = rnd.Next(360);
                float scale = 0.5f + (float)rnd.NextDouble() * 0.85f;
                DrawBougainvilleaLeafPro(g, lx, ly, ang, scale);
            }

            // 1200 cụm hoa giấy đỏ hồng rực rỡ buông rủ
            for (int j = 0; j < 1250; j++)
            {
                float fx = rnd.Next(60, 964);
                double maxFlowH = 780 + 220 * Math.Sin(fx / 1024.0 * Math.PI);
                float fy = rnd.Next(40, (int)maxFlowH);
                float fscale = 0.55f + (float)rnd.NextDouble() * 0.95f;
                float frot = rnd.Next(360);
                DrawBougainvilleaBractClusterPro(g, fx, fy, fscale, frot);
            }

            // Cánh hoa rơi lất phất ở đáy
            for (int drop = 0; drop < 100; drop++)
            {
                float dx = rnd.Next(80, 944);
                float dy = rnd.Next(780, 1010);
                float dscale = 0.4f + (float)rnd.NextDouble() * 0.5f;
                DrawBougainvilleaBractClusterPro(g, dx, dy, dscale, rnd.Next(360));
            }

            bmp.Save("assets/textures/bougainvillea_blossom.png", ImageFormat.Png);
        }
        Console.WriteLine("-> Nâng cấp thành công: assets/textures/bougainvillea_blossom.png (Alpha PNG)");
    }

    private static void DrawBougainvilleaLeafPro(Graphics g, float lx, float ly, float angle, float scale)
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

    private static void DrawBougainvilleaBractClusterPro(Graphics g, float cx, float cy, float scale, float rot)
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

        using (SolidBrush bFloret = new SolidBrush(Color.FromArgb(250, 255, 250, 210)))
        using (SolidBrush bCenter = new SolidBrush(Color.FromArgb(250, 245, 190, 45)))
        {
            g.FillEllipse(bFloret, -4, -4, 8, 8);
            g.FillEllipse(bCenter, -2, -2, 4, 4);
        }

        g.Restore(state);
    }

    // =========================================================================
    // 4. HANOI_SHOP_SIGNS.JPG (2048 x 1024)
    // Biển hiệu vẽ tay thủ công xưa cực kỳ chi tiết, hoen rỉ và tróc sơn thật
    // =========================================================================
    public static void UpgradeShopSigns()
    {
        Console.WriteLine("-> Nâng cấp Photorealistic: assets/textures/hanoi_shop_signs.jpg...");
        int w = 2048, h = 1024;
        using (Bitmap bmp = new Bitmap(w, h))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;

            // Nền tường xi măng cổ phố cổ
            using (SolidBrush bBack = new SolidBrush(Color.FromArgb(42, 40, 38)))
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
            using (SolidBrush bFrame = new SolidBrush(Color.FromArgb(62, 42, 28)))
            using (LinearGradientBrush bSign1 = new LinearGradientBrush(rSign1, Color.FromArgb(26, 56, 40), Color.FromArgb(16, 38, 26), LinearGradientMode.Vertical))
            using (Pen pGold1 = new Pen(Color.FromArgb(225, 180, 60), 4))
            using (Pen pGoldThin = new Pen(Color.FromArgb(170, 135, 45), 1.5f))
            {
                g.FillRectangle(bFrame, 34, 34, 952, 292);
                g.FillRectangle(bSign1, rSign1);
                g.DrawRectangle(pGold1, 52, 52, 916, 256);
                g.DrawRectangle(pGoldThin, 58, 58, 904, 244);
            }

            // Đinh tán 4 góc
            DrawRivet(g, 46, 46, 12);
            DrawRivet(g, 962, 46, 12);
            DrawRivet(g, 46, 302, 12);
            DrawRivet(g, 962, 302, 12);

            using (Font fPho = new Font("Times New Roman", 52, FontStyle.Bold))
            using (SolidBrush bPhoShadow = new SolidBrush(Color.FromArgb(170, 135, 20, 20)))
            using (SolidBrush bPhoGold = new SolidBrush(Color.FromArgb(255, 238, 115)))
            {
                g.DrawString("PHỞ GIA TRUYỀN", fPho, bPhoShadow, 513, 118, sfCenter);
                g.DrawString("PHỞ GIA TRUYỀN", fPho, bPhoGold, 510, 114, sfCenter);
            }

            using (Font fSub1 = new Font("Arial", 22, FontStyle.Bold))
            using (SolidBrush bSub1 = new SolidBrush(Color.FromArgb(240, 75, 60)))
            {
                g.DrawString("BÒ TÁI  •  NẠM  •  GẦU  •  SỐT VANG", fSub1, bSub1, 510, 185, sfCenter);
            }

            using (Font fFoot1 = new Font("Arial", 14, FontStyle.Regular))
            using (SolidBrush bFoot1 = new SolidBrush(Color.FromArgb(205, 220, 185)))
            {
                g.DrawString("HÀ NỘI XƯA  •  ĐẬM ĐÀ NƯỚC DÙNG TRUYỀN THỐNG TỪ NĂM 1954", fFoot1, bFoot1, 510, 240, sfCenter);
            }
            ApplySignWeatheringPro(g, rSign1);

            // -----------------------------------------------------------------
            // BIỂN 2: CÀ PHÊ TRỨNG PHỐ CỔ (1040, 40, 960, 280)
            // -----------------------------------------------------------------
            Rectangle rSign2 = new Rectangle(1040, 40, 960, 280);
            using (LinearGradientBrush bWood = new LinearGradientBrush(rSign2, Color.FromArgb(78, 48, 28), Color.FromArgb(52, 32, 18), LinearGradientMode.Vertical))
            using (Pen pWoodFrame = new Pen(Color.FromArgb(38, 22, 10), 6))
            using (Pen pWoodInner = new Pen(Color.FromArgb(150, 108, 62), 2))
            {
                g.FillRectangle(bWood, rSign2);
                for (int wline = 44; wline < 315; wline += 6)
                {
                    using (Pen pGrain = new Pen(Color.FromArgb(35, 125, 80, 42), 2))
                    {
                        g.DrawLine(pGrain, 1040, wline, 2000, wline);
                    }
                }
                g.DrawRectangle(pWoodFrame, 1044, 44, 952, 272);
                g.DrawRectangle(pWoodInner, 1054, 54, 932, 252);
            }

            DrawRivet(g, 1060, 60, 16);
            DrawRivet(g, 1964, 60, 16);
            DrawRivet(g, 1060, 284, 16);
            DrawRivet(g, 1964, 284, 16);

            using (Font fCoffee = new Font("Georgia", 48, FontStyle.Bold))
            using (SolidBrush bCofShadow = new SolidBrush(Color.FromArgb(210, 25, 15, 8)))
            using (SolidBrush bCofGold = new SolidBrush(Color.FromArgb(248, 218, 128)))
            {
                g.DrawString("CÀ PHÊ TRỨNG", fCoffee, bCofShadow, 1523, 114, sfCenter);
                g.DrawString("CÀ PHÊ TRỨNG", fCoffee, bCofGold, 1520, 110, sfCenter);
            }

            using (Font fSubCoffee = new Font("Times New Roman", 24, FontStyle.Italic))
            using (SolidBrush bSubCoffee = new SolidBrush(Color.FromArgb(238, 188, 112)))
            {
                g.DrawString("- PHỐ CỔ HÀ NỘI -", fSubCoffee, bSubCoffee, 1520, 180, sfCenter);
            }

            using (Font fFootCoffee = new Font("Arial", 15, FontStyle.Bold))
            using (SolidBrush bFootCoffee = new SolidBrush(Color.FromArgb(205, 158, 98)))
            {
                g.DrawString("CÀ PHÊ PHIN TRUYỀN THỐNG  •  KEM TRỨNG BÉO NGẬY HƯƠNG HÀ NỘI", fFootCoffee, bFootCoffee, 1520, 235, sfCenter);
            }
            ApplySignWeatheringPro(g, rSign2);

            // -----------------------------------------------------------------
            // BIỂN 3: BÁCH HÓA TỔNG HỢP (40, 360, 940, 300)
            // -----------------------------------------------------------------
            Rectangle rSign3 = new Rectangle(40, 360, 940, 300);
            using (SolidBrush bStFrame = new SolidBrush(Color.FromArgb(48, 38, 32)))
            using (LinearGradientBrush bRedGov = new LinearGradientBrush(rSign3, Color.FromArgb(185, 30, 28), Color.FromArgb(145, 22, 20), LinearGradientMode.Vertical))
            using (Pen pGovBorder = new Pen(Color.FromArgb(245, 210, 68), 5))
            {
                g.FillRectangle(bStFrame, 34, 354, 952, 312);
                g.FillRectangle(bRedGov, rSign3);
                g.DrawRectangle(pGovBorder, 54, 374, 912, 272);
            }

            using (Font fGovTop = new Font("Arial", 17, FontStyle.Bold))
            using (SolidBrush bGovYellow = new SolidBrush(Color.FromArgb(248, 218, 78)))
            {
                g.DrawString("CỬA HÀNG MẬU DỊCH QUỐC DOANH SỐ 12", fGovTop, bGovYellow, 510, 412, sfCenter);
            }

            using (Font fGovMain = new Font("Impact", 56, FontStyle.Regular))
            using (SolidBrush bBlackShadow = new SolidBrush(Color.FromArgb(225, 20, 10, 10)))
            using (SolidBrush bGovBright = new SolidBrush(Color.FromArgb(255, 238, 65)))
            {
                g.DrawString("BÁCH HÓA TỔNG HỢP", fGovMain, bBlackShadow, 514, 482, sfCenter);
                g.DrawString("BÁCH HÓA TỔNG HỢP", fGovMain, bGovBright, 510, 478, sfCenter);
            }

            using (Font fGovBot = new Font("Arial", 15, FontStyle.Bold))
            using (SolidBrush bGovWhite = new SolidBrush(Color.FromArgb(248, 248, 238)))
            {
                g.DrawString("PHỤC VỤ TẬN TÌNH  •  PHÂN PHỐI THEO TEM PHIẾU TIÊU CHUẨN", fGovBot, bGovWhite, 510, 560, sfCenter);
            }
            ApplySignWeatheringPro(g, rSign3);

            // -----------------------------------------------------------------
            // BIỂN 4: BIA HƠI HÀ NỘI 1986 (1040, 360, 960, 300)
            // -----------------------------------------------------------------
            Rectangle rSign4 = new Rectangle(1040, 360, 960, 300);
            using (SolidBrush bBeerFrame = new SolidBrush(Color.FromArgb(42, 28, 18)))
            using (LinearGradientBrush bBeerBg = new LinearGradientBrush(rSign4, Color.FromArgb(242, 165, 32), Color.FromArgb(215, 140, 22), LinearGradientMode.Vertical))
            using (Pen pBeerBorder = new Pen(Color.FromArgb(165, 26, 22), 6))
            {
                g.FillRectangle(bBeerFrame, 1034, 354, 972, 312);
                g.FillRectangle(bBeerBg, rSign4);
                g.DrawRectangle(pBeerBorder, 1054, 374, 932, 272);
            }

            using (Font fBeer = new Font("Arial", 54, FontStyle.Bold))
            using (SolidBrush bBeerShadow = new SolidBrush(Color.FromArgb(195, 62, 16, 12)))
            using (SolidBrush bBeerRed = new SolidBrush(Color.FromArgb(200, 26, 22)))
            {
                g.DrawString("BIA HƠI HÀ NỘI", fBeer, bBeerShadow, 1524, 452, sfCenter);
                g.DrawString("BIA HƠI HÀ NỘI", fBeer, bBeerRed, 1520, 448, sfCenter);
            }

            using (Font fYear = new Font("Impact", 36, FontStyle.Regular))
            using (SolidBrush bYear = new SolidBrush(Color.FromArgb(42, 28, 22)))
            {
                g.DrawString("*  1 9 8 6  *", fYear, bYear, 1520, 524, sfCenter);
            }

            using (Font fBeerSub = new Font("Arial", 15, FontStyle.Bold))
            using (SolidBrush bBeerSub = new SolidBrush(Color.FromArgb(125, 22, 16)))
            {
                g.DrawString("ĐẬM ĐÀ HƯƠNG VỊ THỦ ĐÔ  •  CỐC VẠI XANH HUYỀN THOẠI", fBeerSub, bBeerSub, 1520, 582, sfCenter);
            }
            ApplySignWeatheringPro(g, rSign4);

            // -----------------------------------------------------------------
            // BIỂN 5: HIỆU SÁCH CŨ (40, 700, 1960, 280)
            // -----------------------------------------------------------------
            Rectangle rSign5 = new Rectangle(40, 700, 1960, 280);
            using (SolidBrush bFrame5 = new SolidBrush(Color.FromArgb(46, 32, 22)))
            using (LinearGradientBrush bPaper = new LinearGradientBrush(rSign5, Color.FromArgb(232, 214, 172), Color.FromArgb(215, 196, 152), LinearGradientMode.Vertical))
            using (Pen pBookBorder = new Pen(Color.FromArgb(36, 56, 82), 4))
            using (Pen pBookThin = new Pen(Color.FromArgb(125, 102, 72), 1.5f))
            {
                g.FillRectangle(bFrame5, 34, 694, 1972, 292);
                g.FillRectangle(bPaper, rSign5);
                g.DrawRectangle(pBookBorder, 54, 714, 1932, 252);
                g.DrawRectangle(pBookThin, 62, 722, 1916, 236);
            }

            using (Font fBook = new Font("Georgia", 60, FontStyle.Bold))
            using (SolidBrush bInkShadow = new SolidBrush(Color.FromArgb(145, 42, 48, 52)))
            using (SolidBrush bInk = new SolidBrush(Color.FromArgb(26, 50, 88)))
            {
                g.DrawString("HIỆU SÁCH CŨ", fBook, bInkShadow, 1024, 782, sfCenter);
                g.DrawString("HIỆU SÁCH CŨ", fBook, bInk, 1020, 778, sfCenter);
            }

            using (Font fBookSub = new Font("Times New Roman", 24, FontStyle.Italic))
            using (SolidBrush bBookSub = new SolidBrush(Color.FromArgb(125, 36, 32)))
            {
                g.DrawString("Chuyên: SÁCH VĂN HỌC  •  LỊCH SỬ  •  BÁO CŨ  •  TRANH ẢNH HÀ NỘI XƯA", fBookSub, bBookSub, 1020, 858, sfCenter);
            }

            using (Font fBookFoot = new Font("Arial", 16, FontStyle.Bold))
            using (SolidBrush bBookFoot = new SolidBrush(Color.FromArgb(78, 68, 58)))
            {
                g.DrawString("THU MUA & TRAO ĐỔI SÁCH QUÝ  -  LƯU GIỮ KÝ ỨC THĂNG LONG HÀ NỘI", fBookFoot, bBookFoot, 1020, 915, sfCenter);
            }
            ApplySignWeatheringPro(g, rSign5);

            SaveHighQualityJpeg(bmp, "assets/textures/hanoi_shop_signs.jpg", 96L);
        }
        Console.WriteLine("-> Nâng cấp thành công: assets/textures/hanoi_shop_signs.jpg (2048x1024)");
    }

    private static void ApplySignWeatheringPro(Graphics g, Rectangle rect)
    {
        for (int k = 0; k < 550; k++)
        {
            int gx = rect.X + rnd.Next(rect.Width);
            int gy = rect.Y + rnd.Next(rect.Height);
            int gsz = rnd.Next(2, 30);
            int galpha = rnd.Next(15, 65);
            using (SolidBrush bGr = new SolidBrush(Color.FromArgb(galpha, 42, 24, 12)))
            {
                g.FillEllipse(bGr, gx, gy, gsz, gsz);
            }
        }

        // Vết rỉ sét và tróc sơn ở mép
        for (int e = 0; e < 150; e++)
        {
            int ex = rect.X + rnd.Next(rect.Width);
            int ey = (rnd.Next(2) == 0) ? rect.Y + rnd.Next(18) : rect.Y + rect.Height - rnd.Next(1, 18);
            using (SolidBrush bPeel = new SolidBrush(Color.FromArgb(185, 75, 45, 25)))
            {
                g.FillRectangle(bPeel, ex, ey, rnd.Next(4, 22), rnd.Next(3, 9));
            }
        }
    }
}

public class MidD {
    public static void main(String[] args) {
        int m = 3, n = 2, ans = 0, c;
        for (c = 0; c < 5; c++) {
            if (c % 2 == 0) {
                 ans += m++ * n;
                 System.out.println(ans--);
            } else {
                  ans += --m + n++;
                  System.out.println(++ans);
            }
        }
    }
}

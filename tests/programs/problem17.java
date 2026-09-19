public class P17 {
    public static void main(String[] args) {
        int p, y = 25, w = 14, j = 12, z = 2, c = 3;
        double d = 42;
        p = y / 3 % 2;
        System.out.println(y - p / 2);
        j *= 2;
        w = w / 2 * 3 - j;
        System.out.println(w % 2 + j);
        z += 8;
        d /= 2;
        c = z % c;
        d = 1 + d / c + 21;
        System.out.println(d / 2 + 3 + "c");
        c = c++ + c-- + z++ + z-- + ++c;
        System.out.println(c * 2 + d);
    }
}
